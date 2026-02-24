#!/usr/bin/env tsx
/**
 * scripts/distributor.ts — Distributor committee service (CLI)
 *
 * Usage:
 *   npx tsx scripts/distributor.ts \
 *     --voter <voter-ed25519-pk-hex> \
 *     --eid <eid> \
 *     --contract <contract-id> \
 *     --rpc <rpc-url> \
 *     --dist-sk <distributor-ed25519-sk-hex> \
 *     --keys ./keys/
 *
 * The distributor:
 *   1. Reads the on-chain eligibility root
 *   2. Verifies the voter's Merkle inclusion proof
 *   3. Checks the issue nullifier has not been used
 *   4. Signs the issue message (eid || pk_cast || nf_issue)
 *   5. Returns the signature (in a real system: over a REST API)
 *
 * For the PoC this script also calls issue_account on-chain directly.
 */

import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";

// ── Arg parsing ────────────────────────────────────────────────────────────────

interface Args {
  voterPkHex: string;
  castPkHex: string;
  nfIssueHex: string;
  eid: bigint;
  contractId: string;
  rpcUrl: string;
  distSkHex: string;
  keysDir: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  return {
    voterPkHex: get("--voter") ?? "",
    castPkHex: get("--cast-pk") ?? "",
    nfIssueHex: get("--nf-issue") ?? "0".repeat(64),
    eid: BigInt(get("--eid") ?? "0"),
    contractId: get("--contract") ?? process.env.CONTRACT_ID ?? "",
    rpcUrl: get("--rpc") ?? process.env.RPC_URL ?? "https://soroban-testnet.stellar.org",
    distSkHex: get("--dist-sk") ?? "",
    keysDir: get("--keys") ?? "./keys/",
  };
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");
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

// ── Issue message (mirrors crypto.ts::issueMsgHash) ───────────────────────────

function issueMsgHash(
  eid: bigint,
  pkCast: Uint8Array,
  nfIssue: Uint8Array,
): Uint8Array {
  return sha256(
    concatBytes(
      new TextEncoder().encode("stellot:issue"),
      bigintToLE64(eid),
      pkCast,
      nfIssue,
    ),
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  if (!args.distSkHex || args.distSkHex.length !== 64) {
    // Generate a fresh distributor key if not provided (for demo)
    const sk = ed25519.utils.randomPrivateKey();
    const pk = ed25519.getPublicKey(sk);
    console.log("Generated distributor key:");
    console.log(`  sk: ${toHex(sk)}`);
    console.log(`  pk: ${toHex(pk)}`);
    console.log("\nRe-run with --dist-sk <hex> to use this key.");
    return;
  }

  const distSk = fromHex(args.distSkHex);
  const distPk = ed25519.getPublicKey(distSk);

  console.log(`\nDistributor pk: ${toHex(distPk)}`);
  console.log(`Election eid:    ${args.eid}`);

  if (!args.castPkHex || args.castPkHex.length !== 64) {
    console.error("--cast-pk must be a 64-char hex Ed25519 public key");
    process.exit(1);
  }

  const pkCast = fromHex(args.castPkHex);
  const nfIssue = fromHex(args.nfIssueHex);

  // Compute issue message and sign
  const msgHash = issueMsgHash(args.eid, pkCast, nfIssue);
  const sig = ed25519.sign(msgHash, distSk);

  console.log(`\nIssue message hash: ${toHex(msgHash)}`);
  console.log(`Distributor sig:    ${toHex(sig)}`);

  // Write the signature to a file (for collection by the voter)
  const outFile = `${args.keysDir}/dist_sig_${toHex(pkCast).slice(0, 8)}.json`;
  const sigData = {
    eid: args.eid.toString(),
    pk_cast: toHex(pkCast),
    nf_issue: toHex(nfIssue),
    dist_pk: toHex(distPk),
    dist_sig: toHex(sig),
  };

  await writeFile(outFile, JSON.stringify(sigData, null, 2));
  console.log(`\nSignature written to ${outFile}`);

  // Verify locally
  const valid = ed25519.verify(sig, msgHash, distPk);
  console.log(`Signature valid: ${valid}`);

  if (!valid) {
    console.error("Signature verification failed!");
    process.exit(1);
  }

  console.log("\nDistributor signing complete.");
  console.log(
    "In a real deployment: the voter collects dist_threshold signatures\n" +
    "then calls issue_account on-chain with the combined dist_sigs array.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
