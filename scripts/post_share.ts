#!/usr/bin/env tsx
/**
 * scripts/post_share.ts — Key-holder posts decryption shares (CLI)
 *
 * Usage (post shares for one KH):
 *   npx tsx scripts/post_share.ts \
 *     --kh ./keys/kh1.json \
 *     --eid 0 \
 *     --contract <contract-id> \
 *     --rpc local \
 *     --source deploy
 *
 * Usage (finalize tally after all shares posted):
 *   npx tsx scripts/post_share.ts \
 *     --finalize \
 *     --eid 0 \
 *     --kh-dir ./keys/ \
 *     --m 3 \
 *     --t 2 \
 *     --options-count 2 \
 *     --contract <contract-id> \
 *     --rpc local \
 *     --source deploy
 *
 * --rpc accepts either a network name (local, testnet, mainnet) or a full RPC URL.
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";
import { readFile } from "fs/promises";
import { spawnSync } from "child_process";

const Q = secp256k1.CURVE.n;

// ── Utility ────────────────────────────────────────────────────────────────────

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function toHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function bigintToLE64(n: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  let rem = n;
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(rem & 0xffn);
    rem >>= 8n;
  }
  return buf;
}

function u32LE(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
}

// ── Crypto helpers ─────────────────────────────────────────────────────────────

function partialDecrypt(c1Hex: string, skBig: bigint): Uint8Array {
  const C1 = secp256k1.ProjectivePoint.fromHex(c1Hex);
  return C1.multiply(skBig).toRawBytes(true);
}

function serialiseShares(shares: Array<[Uint8Array, Uint8Array]>): Uint8Array {
  const parts: Uint8Array[] = [u32LE(shares.length)];
  for (const [c1, d] of shares) {
    parts.push(u32LE(c1.length), c1, u32LE(d.length), d);
  }
  return concatBytes(...parts);
}

function sharesMsgHash(eid: bigint, blob: Uint8Array): Uint8Array {
  return sha256(
    concatBytes(new TextEncoder().encode("stellot:shares"), bigintToLE64(eid), blob),
  );
}

function lagrangeCoeff(j: number, S: number[]): bigint {
  let num = 1n;
  let den = 1n;
  for (const k of S) {
    if (k === j) continue;
    num = (num * BigInt(k)) % Q;
    den = (den * BigInt(k - j)) % Q;
  }
  return (num * modInv(den, Q)) % Q;
}

function modInv(a: bigint, m: bigint): bigint {
  let [old_r, r] = [((a % m) + m) % m, m];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return ((old_s % m) + m) % m;
}

// ── KH file format ─────────────────────────────────────────────────────────────

interface KHFile {
  index: number;
  sk: string;       // secp256k1 scalar (hex)
  commitment: string; // 33-byte compressed A_j0 (hex)
  ed_sk: string;    // Ed25519 secret key (hex)
  ed_pk: string;    // Ed25519 public key (hex)
}

// ── Arg parsing ────────────────────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    finalize: argv.includes("--finalize"),
    khFile: get("--kh"),
    khDir: get("--kh-dir") ?? "./keys/",
    m: parseInt(get("--m") ?? "3"),
    t: parseInt(get("--t") ?? "2"),
    eid: BigInt(get("--eid") ?? "0"),
    contractId: get("--contract") ?? process.env.CONTRACT_ID ?? "",
    rpcUrl: get("--rpc") ?? process.env.RPC_URL ?? "local",
    source: get("--source") ?? "deploy",
    optionsCount: parseInt(get("--options-count") ?? "2"),
  };
}

// ── Ballot fetcher ─────────────────────────────────────────────────────────────

interface Ballot {
  c1: Uint8Array;
  c2: Uint8Array;
}

async function fetchBallots(khDir: string): Promise<Ballot[]> {
  // Reads ballots written by e2e.sh from keys/ballots.json
  try {
    const raw = await readFile(`${khDir}/ballots.json`, "utf-8");
    const data = JSON.parse(raw) as Array<{ c1: string; c2: string }>;
    return data.map((b) => ({
      c1: fromHex(b.c1),
      c2: fromHex(b.c2),
    }));
  } catch {
    console.warn("No ballots.json found — using empty ballot set");
    return [];
  }
}

// ── Stellar invoke helper ──────────────────────────────────────────────────────

function stellarInvoke(
  contractId: string,
  rpcUrl: string,
  source: string,
  fnArgs: string[],
): void {
  // rpcUrl can be a network name ("local", "testnet") or a full URL
  const networkArgs: string[] = rpcUrl.includes("://")
    ? ["--rpc-url", rpcUrl]
    : ["--network", rpcUrl];

  const args = [
    "contract", "invoke",
    "--id", contractId,
    "--source", source,
    ...networkArgs,
    "--",
    ...fnArgs,
  ];

  console.log(`\nCalling: stellar ${args.join(" ")}`);
  const result = spawnSync("stellar", args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`stellar contract invoke failed (status=${result.status})`);
  }
}

// ── Main: post shares ──────────────────────────────────────────────────────────

async function postSharesForKH(
  kh: KHFile,
  eid: bigint,
  ballots: Ballot[],
  contractId: string,
  rpcUrl: string,
  source: string,
) {
  const skBig = BigInt("0x" + kh.sk);
  const edSk = fromHex(kh.ed_sk);
  const edPk = fromHex(kh.ed_pk);

  console.log(`\nKH ${kh.index}: computing ${ballots.length} partial decryption(s)…`);

  const shares: Array<[Uint8Array, Uint8Array]> = ballots.map((b) => [
    b.c1,
    partialDecrypt(toHex(b.c1), skBig),
  ]);

  for (let i = 0; i < shares.length; i++) {
    const [c1, d] = shares[i];
    console.log(`  ballot ${i}: C1=${toHex(c1).slice(0, 16)}…  D=${toHex(d).slice(0, 16)}…`);
  }

  // Compute Chaum-Pedersen proof (off-chain verification; on-chain only checks KH sig)
  if (ballots.length > 0) {
    const r = BigInt("0x" + toHex(secp256k1.utils.randomPrivateKey()));
    const C1 = secp256k1.ProjectivePoint.fromHex(shares[0][0]);
    const D  = secp256k1.ProjectivePoint.fromHex(shares[0][1]);
    const R1 = secp256k1.ProjectivePoint.BASE.multiply(r);
    const R2 = C1.multiply(r);
    const PK_j = secp256k1.ProjectivePoint.BASE.multiply(skBig);

    const cpChallenge = sha256(
      concatBytes(
        secp256k1.ProjectivePoint.BASE.toRawBytes(true),
        PK_j.toRawBytes(true),
        C1.toRawBytes(true),
        D.toRawBytes(true),
        R1.toRawBytes(true),
        R2.toRawBytes(true),
      ),
    );
    const c = BigInt("0x" + toHex(cpChallenge)) % Q;
    const s = (r + c * skBig) % Q;

    console.log(`\n  Chaum-Pedersen proof (ballot 0):`);
    console.log(`    R1 = ${toHex(R1.toRawBytes(true)).slice(0, 16)}…`);
    console.log(`    s  = ${s.toString(16).slice(0, 16)}…`);
    console.log(`  (verified off-chain; on-chain only checks KH signature)`);
  }

  // Sign the shares blob with Ed25519
  const blob = serialiseShares(shares);
  const msgHash = sharesMsgHash(eid, blob);
  const sig = ed25519.sign(msgHash, edSk);

  console.log(`\nSigning with Ed25519 key ${toHex(edPk).slice(0, 16)}…`);
  console.log(`  Message hash: ${toHex(msgHash).slice(0, 16)}…`);
  console.log(`  Signature:    ${toHex(sig).slice(0, 16)}…`);

  // Format shares for Soroban CLI: Vec<(Bytes, Bytes)> → [["c1hex","dhex"],...]
  const sharesJson = JSON.stringify(shares.map(([c1, d]) => [toHex(c1), toHex(d)]));
  const khIdxStr = String(kh.index - 1); // contract uses 0-based index

  stellarInvoke(contractId, rpcUrl, source, [
    "post_share",
    "--eid", String(Number(eid)),
    "--kh_idx", khIdxStr,
    "--shares", sharesJson,
    "--kh_pk", kh.ed_pk,
    "--sig", toHex(sig),
  ]);

  console.log(`\nKH ${kh.index} shares posted successfully.`);
}

// ── Main: finalize tally ───────────────────────────────────────────────────────

async function finalizeAndPrint(
  m: number,
  t: number,
  eid: bigint,
  khDir: string,
  ballots: Ballot[],
  contractId: string,
  rpcUrl: string,
  source: string,
  optionsCount: number,
) {
  // Load up to m KH files; use the first t that are available
  const khFiles: KHFile[] = [];
  for (let i = 1; i <= m; i++) {
    try {
      const raw = await readFile(`${khDir}/kh${i}.json`, "utf-8");
      khFiles.push(JSON.parse(raw));
    } catch {
      console.warn(`Skipping kh${i}.json (not found)`);
    }
  }

  if (khFiles.length < t) {
    throw new Error(`Need at least ${t} KH files, found ${khFiles.length}`);
  }

  const useKH = khFiles.slice(0, t);
  const indices = useKH.map((kh) => kh.index); // 1-based
  console.log(`\nRunning Lagrange with KH indices: ${indices.join(", ")}`);

  // Per-option vote counts
  const optionCounts = new Array(optionsCount).fill(0);

  for (let i = 0; i < ballots.length; i++) {
    const shares = new Map<number, Uint8Array>();
    for (const kh of useKH) {
      const skBig = BigInt("0x" + kh.sk);
      shares.set(kh.index, partialDecrypt(toHex(ballots[i].c1), skBig));
    }

    // Lagrange combination: D_i = Σ_j(λ_j · D_ji)
    let D = secp256k1.ProjectivePoint.ZERO;
    for (const j of indices) {
      const lambda = lagrangeCoeff(j, indices);
      D = D.add(secp256k1.ProjectivePoint.fromHex(shares.get(j)!).multiply(lambda));
    }

    // V = C2 - D = (v+1)·G
    const C2 = secp256k1.ProjectivePoint.fromHex(ballots[i].c2);
    const V = C2.subtract(D);
    const Vhex = toHex(V.toRawBytes(true));

    // Brute-force discrete log: try 1·G, 2·G, … until match
    let acc = secp256k1.ProjectivePoint.BASE;
    let vote = -1;
    for (let vp1 = 1; vp1 <= optionsCount + 10; vp1++) {
      if (toHex(acc.toRawBytes(true)) === Vhex) {
        vote = vp1 - 1;
        break;
      }
      acc = acc.add(secp256k1.ProjectivePoint.BASE);
    }

    console.log(`  Ballot ${i}: vote=${vote >= 0 ? vote : "UNKNOWN"}`);
    if (vote >= 0 && vote < optionsCount) optionCounts[vote]++;
  }

  const finalTally = optionCounts; // already sized to optionsCount
  console.log(`\nTally: ${JSON.stringify(finalTally)}`);

  // Submit finalize_tally to contract
  stellarInvoke(contractId, rpcUrl, source, [
    "finalize_tally",
    "--eid", String(Number(eid)),
    "--tally", JSON.stringify(finalTally),
  ]);

  console.log("\nTally finalized on-chain.");
}

// ── Entry point ────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const ballots = await fetchBallots(args.khDir);

  if (args.finalize) {
    await finalizeAndPrint(
      args.m, args.t, args.eid, args.khDir, ballots,
      args.contractId, args.rpcUrl, args.source, args.optionsCount,
    );
  } else {
    if (!args.khFile) {
      console.error("--kh <path-to-kh-file.json> is required");
      process.exit(1);
    }
    const raw = await readFile(args.khFile, "utf-8");
    const kh: KHFile = JSON.parse(raw);
    await postSharesForKH(
      kh, args.eid, ballots, args.contractId, args.rpcUrl, args.source,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
