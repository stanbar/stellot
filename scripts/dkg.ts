#!/usr/bin/env tsx
/**
 * scripts/dkg.ts — Feldman VSS DKG ceremony (CLI)
 *
 * Usage:
 *   npx tsx scripts/dkg.ts --m 3 --t 2 --output ./keys/
 *
 * Simulates all m parties locally with real Feldman VSS algebra.
 * Writes per-KH key files and a combined_pubkey.json.
 *
 * In production each party would run independently and exchange shares
 * over authenticated channels.
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

const Q = secp256k1.CURVE.n;

// ── Arg parsing ────────────────────────────────────────────────────────────────

function parseArgs(): { m: number; t: number; output: string } {
  const args = process.argv.slice(2);
  let m = 3, t = 2, output = "./keys/";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--m") m = parseInt(args[++i]);
    else if (args[i] === "--t") t = parseInt(args[++i]);
    else if (args[i] === "--output") output = args[++i];
  }
  return { m, t, output };
}

// ── Math helpers ───────────────────────────────────────────────────────────────

function randomScalar(): bigint {
  while (true) {
    const bytes = secp256k1.utils.randomPrivateKey();
    const n = bytesToBigInt(bytes);
    if (n > 0n && n < Q) return n;
  }
}

function polyEval(coeffs: bigint[], x: bigint): bigint {
  let result = 0n;
  let xpow = 1n;
  for (const c of coeffs) {
    result = (result + c * xpow) % Q;
    xpow = (xpow * x) % Q;
  }
  return (result + Q) % Q;
}

function powMod(base: bigint, exp: bigint, m: bigint): bigint {
  let r = 1n;
  base = ((base % m) + m) % m;
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % m;
    base = (base * base) % m;
    exp >>= 1n;
  }
  return r;
}

function bytesToBigInt(b: Uint8Array): bigint {
  let n = 0n;
  for (const x of b) n = (n << 8n) | BigInt(x);
  return n;
}

function toHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ── DKG ceremony ───────────────────────────────────────────────────────────────

async function main() {
  const { m, t, output } = parseArgs();

  console.log(`\nFeldman VSS DKG — m=${m} parties, t=${t} threshold\n`);

  if (t > m) throw new Error(`threshold t=${t} > parties m=${m}`);
  if (t < 1) throw new Error("threshold must be >= 1");

  // Step 1: Each party samples a degree-(t-1) polynomial
  const polynomials: bigint[][] = [];
  const allCommitments: Uint8Array[][] = [];
  const edIdentityKeys: Uint8Array[] = []; // Ed25519 identity keys for each KH

  for (let j = 0; j < m; j++) {
    const coeffs: bigint[] = [];
    const comms: Uint8Array[] = [];
    for (let k = 0; k < t; k++) {
      const a = randomScalar();
      coeffs.push(a);
      comms.push(secp256k1.ProjectivePoint.BASE.multiply(a).toRawBytes(true));
    }
    polynomials.push(coeffs);
    allCommitments.push(comms);
    // Ed25519 identity key for this KH (used to sign share submissions)
    edIdentityKeys.push(ed25519.utils.randomPrivateKey());
  }

  console.log("Step 1: Polynomials sampled, commitments computed.");

  // Step 2: Verify all cross-shares (s_ji * G == sum_k(A_jk * i^k))
  let verifyOk = true;
  for (let j = 0; j < m; j++) {
    for (let i = 1; i <= m; i++) {
      const s_ji = polyEval(polynomials[j], BigInt(i));
      const lhs = secp256k1.ProjectivePoint.BASE.multiply(s_ji);

      let rhs = secp256k1.ProjectivePoint.ZERO;
      for (let k = 0; k < t; k++) {
        const A_jk = secp256k1.ProjectivePoint.fromHex(allCommitments[j][k]);
        const ik = powMod(BigInt(i), BigInt(k), Q);
        rhs = rhs.add(A_jk.multiply(ik));
      }

      if (lhs.toHex() !== rhs.toHex()) {
        console.error(`VSS verification FAILED: party ${j} → evaluatee ${i}`);
        verifyOk = false;
      }
    }
  }
  if (!verifyOk) process.exit(1);
  console.log("Step 2: All VSS shares verified. ✓");

  // Step 3: Each party accumulates their Shamir share
  // sk_i = sum_j(f_j(i))
  const khShares: Array<{ index: number; sk: bigint; commitment: Uint8Array }> = [];
  for (let i = 1; i <= m; i++) {
    let sk_i = 0n;
    for (let j = 0; j < m; j++) {
      sk_i = (sk_i + polyEval(polynomials[j], BigInt(i))) % Q;
    }
    khShares.push({
      index: i,
      sk: sk_i,
      commitment: allCommitments[i - 1][0],
    });
  }
  console.log("Step 3: Combined Shamir shares derived.");

  // Step 4: Combined public key = sum_j(A_j0)
  let PK = secp256k1.ProjectivePoint.ZERO;
  for (let j = 0; j < m; j++) {
    PK = PK.add(secp256k1.ProjectivePoint.fromHex(allCommitments[j][0]));
  }
  const combinedPubkeyHex = toHex(PK.toRawBytes(true));
  console.log(`Step 4: Combined public key: ${combinedPubkeyHex}`);

  // Write output files
  if (!existsSync(output)) {
    await mkdir(output, { recursive: true });
  }

  // Per-KH files
  for (let i = 0; i < m; i++) {
    const share = khShares[i];
    const edSk = edIdentityKeys[i];
    const edPk = ed25519.getPublicKey(edSk);

    const khFile = {
      index: share.index,
      sk: share.sk.toString(16).padStart(64, "0"),
      commitment: toHex(share.commitment),
      ed_sk: toHex(edSk),
      ed_pk: toHex(edPk),
    };

    await writeFile(
      `${output}/kh${i + 1}.json`,
      JSON.stringify(khFile, null, 2),
    );
    console.log(`  → Wrote ${output}/kh${i + 1}.json (ed_pk: ${toHex(edPk).slice(0, 16)}…)`);
  }

  // Combined pubkey + all commitments
  const summary = {
    m,
    t,
    combined_pubkey: combinedPubkeyHex,
    kh_ed_pks: khShares.map((_, i) => toHex(ed25519.getPublicKey(edIdentityKeys[i]))),
    commitments: allCommitments.map((row) => row.map(toHex)),
  };

  await writeFile(`${output}/combined_pubkey.json`, JSON.stringify(summary, null, 2));
  console.log(`  → Wrote ${output}/combined_pubkey.json`);

  // Merkle root placeholder
  const merkleRootPlaceholder = toHex(new Uint8Array(32));
  await writeFile(`${output}/merkle_root.txt`, merkleRootPlaceholder);
  console.log(`  → Wrote ${output}/merkle_root.txt (placeholder — run distributor.ts to set real root)`);

  console.log("\nDKG ceremony complete.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
