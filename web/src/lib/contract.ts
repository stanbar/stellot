/**
 * contract.ts — Soroban RPC wrappers for the election contract
 *
 * Uses @stellar/stellar-sdk to submit/simulate transactions against
 * the deployed election contract on a Soroban-capable Stellar network.
 */

import {
  Contract,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
  Keypair,
} from "@stellar/stellar-sdk";
import { bytesToHex } from "@noble/hashes/utils";

// ── Configuration ──────────────────────────────────────────────────────────────

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? Networks.TESTNET;
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ElectionInfo {
  eid: bigint;
  title: string;
  optionsCount: number;
  startTime: bigint;
  endTime: bigint;
  encPubkey: Uint8Array;
  tallied: boolean;
}

export interface EncryptedBallot {
  nfCast: Uint8Array;
  c1: Uint8Array;
  c2: Uint8Array;
}

// ── RPC client factory ─────────────────────────────────────────────────────────

function getRpc() {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: true });
}

function getContract() {
  return new Contract(CONTRACT_ID);
}

// ── Friendbot helper ───────────────────────────────────────────────────────────

function getFriendbotUrl(): string {
  if (RPC_URL.includes("localhost") || RPC_URL.includes("127.0.0.1")) {
    // Local sandbox: replace /soroban/rpc suffix with /friendbot
    return RPC_URL.replace(/\/soroban\/rpc\/?$/, "/friendbot");
  }
  return "https://friendbot.stellar.org";
}

/**
 * Fund `publicKey` via Friendbot if the account doesn't exist yet.
 * Safe to call repeatedly — a no-op if already funded.
 */
export async function fundAccountIfNeeded(publicKey: string): Promise<void> {
  const rpc = getRpc();
  try {
    await rpc.getAccount(publicKey);
    return; // already exists
  } catch {
    // fall through to fund
  }
  const url = `${getFriendbotUrl()}?addr=${publicKey}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text().catch(() => resp.statusText);
    throw new Error(`Friendbot funding failed: ${text}`);
  }
  // Wait for the account to appear on-chain (up to 10 s)
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      await rpc.getAccount(publicKey);
      return;
    } catch { /* not yet */ }
  }
  throw new Error("Account still not found after Friendbot funding");
}

// ── Submit helper ──────────────────────────────────────────────────────────────

async function submitTx(
  kp: Keypair,
  methodName: string,
  args: xdr.ScVal[],
): Promise<xdr.ScVal> {
  const rpc = getRpc();
  await fundAccountIfNeeded(kp.publicKey());
  const account = await rpc.getAccount(kp.publicKey());
  const contract = getContract();

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`);
  }

  const assembled = SorobanRpc.assembleTransaction(tx, simResult).build();
  assembled.sign(kp);

  const sendResult = await rpc.sendTransaction(assembled);
  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sendResult)}`);
  }

  // Poll for completion
  let getResult;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    getResult = await rpc.getTransaction(sendResult.hash);
    if (getResult.status !== "NOT_FOUND") break;
  }

  if (!getResult || getResult.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${JSON.stringify(getResult)}`);
  }

  return getResult.returnValue ?? xdr.ScVal.scvVoid();
}

// ── Call (read-only) helper ────────────────────────────────────────────────────

async function callReadOnly(
  methodName: string,
  args: xdr.ScVal[],
): Promise<xdr.ScVal> {
  const rpc = getRpc();
  const contract = getContract();

  // Use a throwaway keypair for simulation
  const kp = Keypair.random();

  // We simulate using a dummy source account; for read-only calls we
  // construct a minimal tx and simulate it without submitting.
  const account = new SorobanRpc.Server(RPC_URL, { allowHttp: true });

  // Build minimal tx
  const sourceAccount = await rpc.getAccount(kp.publicKey()).catch(() =>
    ({
      accountId: () => kp.publicKey(),
      sequenceNumber: () => "0",
      incrementSequenceNumber: () => {},
    } as any),
  );

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(methodName, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    throw new Error(`Simulation failed: ${JSON.stringify(simResult)}`);
  }

  return simResult.result?.retval ?? xdr.ScVal.scvVoid();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function deployElection(
  kp: Keypair,
  params: {
    title: string;
    optionsCount: number;
    startTime: bigint;
    endTime: bigint;
    encPubkey: Uint8Array;
    eligibilityRoot: Uint8Array;
    distRoster: Uint8Array[];
    distThreshold: number;
    khRoster: Uint8Array[];
    khThreshold: number;
  },
): Promise<bigint> {
  const args = [
    xdr.ScVal.scvBytes(Buffer.from(new TextEncoder().encode(params.title))),
    nativeToScVal(params.optionsCount, { type: "u32" }),
    nativeToScVal(params.startTime, { type: "u64" }),
    nativeToScVal(params.endTime, { type: "u64" }),
    xdr.ScVal.scvBytes(Buffer.from(params.encPubkey)),
    xdr.ScVal.scvBytes(Buffer.from(params.eligibilityRoot)),
    xdr.ScVal.scvVec(params.distRoster.map((pk) => xdr.ScVal.scvBytes(Buffer.from(pk)))),
    nativeToScVal(params.distThreshold, { type: "u32" }),
    xdr.ScVal.scvVec(params.khRoster.map((pk) => xdr.ScVal.scvBytes(Buffer.from(pk)))),
    nativeToScVal(params.khThreshold, { type: "u32" }),
  ];

  const result = await submitTx(kp, "deploy", args);
  return scValToNative(result) as bigint;
}

export async function setKhCommitment(
  kp: Keypair,
  eid: bigint,
  khIdx: number,
  commitment: Uint8Array,
): Promise<void> {
  await submitTx(kp, "set_kh_commitment", [
    nativeToScVal(eid, { type: "u64" }),
    nativeToScVal(khIdx, { type: "u32" }),
    xdr.ScVal.scvBytes(Buffer.from(commitment)),
  ]);
}

export async function issueAccount(
  kp: Keypair,
  eid: bigint,
  pkCast: Uint8Array,
  nfIssue: Uint8Array,
  distSigs: Array<{ pk: Uint8Array; sig: Uint8Array }>,
): Promise<void> {
  // dist_sigs: Vec<(BytesN<32>, BytesN<64>)>
  // Soroban encodes tuples as inner scvVec, outer scvVec wraps the list.
  const sigsVal = xdr.ScVal.scvVec(
    distSigs.map(({ pk, sig }) =>
      xdr.ScVal.scvVec([
        xdr.ScVal.scvBytes(Buffer.from(pk)),
        xdr.ScVal.scvBytes(Buffer.from(sig)),
      ]),
    ),
  );

  await submitTx(kp, "issue_account", [
    nativeToScVal(eid, { type: "u64" }),
    xdr.ScVal.scvBytes(Buffer.from(pkCast)),
    xdr.ScVal.scvBytes(Buffer.from(nfIssue)),
    sigsVal,
  ]);
}

export async function castBallot(
  kp: Keypair,
  eid: bigint,
  nfCast: Uint8Array,
  c1: Uint8Array,
  c2: Uint8Array,
  pkCast: Uint8Array,
  sig: Uint8Array,
): Promise<number> {
  const result = await submitTx(kp, "cast", [
    nativeToScVal(eid, { type: "u64" }),
    xdr.ScVal.scvBytes(Buffer.from(nfCast)),
    xdr.ScVal.scvBytes(Buffer.from(c1)),
    xdr.ScVal.scvBytes(Buffer.from(c2)),
    xdr.ScVal.scvBytes(Buffer.from(pkCast)),
    xdr.ScVal.scvBytes(Buffer.from(sig)),
  ]);
  return scValToNative(result) as number;
}

export async function postShare(
  kp: Keypair,
  eid: bigint,
  khIdx: number,
  shares: Array<[Uint8Array, Uint8Array]>,
  khPk: Uint8Array,
  sig: Uint8Array,
): Promise<number> {
  // shares: Vec<(Bytes, Bytes)> — same tuple encoding as dist_sigs
  const sharesVal = xdr.ScVal.scvVec(
    shares.map(([c1, d]) =>
      xdr.ScVal.scvVec([
        xdr.ScVal.scvBytes(Buffer.from(c1)),
        xdr.ScVal.scvBytes(Buffer.from(d)),
      ]),
    ),
  );

  const result = await submitTx(kp, "post_share", [
    nativeToScVal(eid, { type: "u64" }),
    nativeToScVal(khIdx, { type: "u32" }),
    sharesVal,
    xdr.ScVal.scvBytes(Buffer.from(khPk)),
    xdr.ScVal.scvBytes(Buffer.from(sig)),
  ]);
  return scValToNative(result) as number;
}

export async function finalizeTally(
  kp: Keypair,
  eid: bigint,
  tally: number[],
): Promise<void> {
  await submitTx(kp, "finalize_tally", [
    nativeToScVal(eid, { type: "u64" }),
    xdr.ScVal.scvVec(tally.map((v) => nativeToScVal(v, { type: "u32" }))),
  ]);
}

export async function getElection(eid: bigint): Promise<ElectionInfo | null> {
  const result = await callReadOnly("get_election", [
    nativeToScVal(eid, { type: "u64" }),
  ]);
  const native = scValToNative(result) as any;
  if (!native) return null;

  return {
    eid: native.eid,
    title: new TextDecoder().decode(native.title),
    optionsCount: native.options_count,
    startTime: native.start_time,
    endTime: native.end_time,
    encPubkey: Uint8Array.from(native.enc_pubkey),
    tallied: native.tallied,
  };
}

export async function getBallotCount(eid: bigint): Promise<number> {
  const result = await callReadOnly("get_ballot_count", [
    nativeToScVal(eid, { type: "u64" }),
  ]);
  return scValToNative(result) as number;
}

export async function getBallot(
  eid: bigint,
  index: number,
): Promise<EncryptedBallot | null> {
  const result = await callReadOnly("get_ballot", [
    nativeToScVal(eid, { type: "u64" }),
    nativeToScVal(index, { type: "u32" }),
  ]);
  const native = scValToNative(result) as any;
  if (!native) return null;
  return {
    nfCast: Uint8Array.from(native.nf_cast),
    c1: Uint8Array.from(native.c1),
    c2: Uint8Array.from(native.c2),
  };
}

export async function getNextElectionId(): Promise<bigint> {
  const result = await callReadOnly("get_next_election_id", []);
  return scValToNative(result) as bigint;
}

export async function getTally(eid: bigint): Promise<number[] | null> {
  const result = await callReadOnly("get_tally", [
    nativeToScVal(eid, { type: "u64" }),
  ]);
  const native = scValToNative(result) as number[] | null;
  return native;
}

export async function isCastNullifierUsed(
  eid: bigint,
  nf: Uint8Array,
): Promise<boolean> {
  const result = await callReadOnly("is_cast_nullifier_used", [
    nativeToScVal(eid, { type: "u64" }),
    xdr.ScVal.scvBytes(Buffer.from(nf)),
  ]);
  return scValToNative(result) as boolean;
}

export async function deleteElection(kp: Keypair, eid: bigint): Promise<void> {
  await submitTx(kp, "delete_election", [
    nativeToScVal(eid, { type: "u64" }),
  ]);
}

export async function getKhRoster(eid: bigint): Promise<Uint8Array[]> {
  const result = await callReadOnly("get_kh_roster", [
    nativeToScVal(eid, { type: "u64" }),
  ]);
  const native = scValToNative(result) as Buffer[] | null;
  if (!native) return [];
  return native.map((b) => Uint8Array.from(b));
}

export async function getKhShares(
  eid: bigint,
  khIdx: number,
): Promise<Uint8Array | null> {
  const result = await callReadOnly("get_kh_shares", [
    nativeToScVal(eid, { type: "u64" }),
    nativeToScVal(khIdx, { type: "u32" }),
  ]);
  const native = scValToNative(result);
  if (!native) return null;
  return Uint8Array.from(native as Buffer);
}
