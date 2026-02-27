/**
 * crypto.ts — Real cryptographic primitives for Stellot†
 *
 * Implements:
 *  - Exponential ElGamal on secp256k1  (@noble/curves)
 *  - Ed25519 casting-account keypairs   (@noble/curves)
 *  - Nullifier derivation               (SHA-256)
 *  - Lagrange interpolation over Z_q    (BigInt)
 *  - Brute-force discrete-log decryption
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes, concatBytes } from "@noble/hashes/utils";

export { bytesToHex, hexToBytes };

// ── Curve constants ────────────────────────────────────────────────────────────

/** secp256k1 group order */
const Q = secp256k1.CURVE.n;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ElGamalCiphertext {
  c1: Uint8Array; // 33-byte compressed point r·G
  c2: Uint8Array; // 33-byte compressed point (v+1)·G + r·PK
}

export interface CastingKeypair {
  sk: Uint8Array; // 32-byte Ed25519 private key seed
  pk: Uint8Array; // 32-byte Ed25519 public key
}

// ── Ed25519 casting keypairs ───────────────────────────────────────────────────

export function generateCastingKeypair(): CastingKeypair {
  const sk = ed25519.utils.randomPrivateKey();
  const pk = ed25519.getPublicKey(sk);
  return { sk, pk };
}

export function castingKeypairFromSeed(seed: Uint8Array): CastingKeypair {
  const pk = ed25519.getPublicKey(seed);
  return { sk: seed, pk };
}

export function ed25519Sign(sk: Uint8Array, msg: Uint8Array): Uint8Array {
  return ed25519.sign(msg, sk);
}

export function ed25519Verify(
  pk: Uint8Array,
  msg: Uint8Array,
  sig: Uint8Array,
): boolean {
  try {
    return ed25519.verify(sig, msg, pk);
  } catch {
    return false;
  }
}

// ── Nullifiers ─────────────────────────────────────────────────────────────────

/** issue nullifier: SHA256("stellot:issue" || sk_voter_32 || eid_le64) */
export function nullifierIssue(skVoter: Uint8Array, eid: bigint): Uint8Array {
  const eidBytes = bigintToLE64(eid);
  return sha256(
    concatBytes(new TextEncoder().encode("stellot:issue"), skVoter, eidBytes),
  );
}

/** cast nullifier: SHA256("stellot:cast" || sk_cast_32 || eid_le64) */
export function nullifierCast(skCast: Uint8Array, eid: bigint): Uint8Array {
  const eidBytes = bigintToLE64(eid);
  return sha256(
    concatBytes(new TextEncoder().encode("stellot:cast"), skCast, eidBytes),
  );
}

/** Message that distributors sign for issue approval.
 *  SHA256("stellot:issue" || eid_le64 || pk_cast_32 || nf_issue_32) */
export function issueMsgHash(
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

/** Message that a voter signs when casting.
 *  SHA256("stellot:cast" || eid_le64 || nf_cast_32 || c1_33 || c2_33) */
export function castMsgHash(
  eid: bigint,
  nfCast: Uint8Array,
  c1: Uint8Array,
  c2: Uint8Array,
): Uint8Array {
  return sha256(
    concatBytes(
      new TextEncoder().encode("stellot:cast"),
      bigintToLE64(eid),
      nfCast,
      c1,
      c2,
    ),
  );
}

/** Message that a KH signs when posting shares.
 *  SHA256("stellot:shares" || eid_le64 || shares_blob) */
export function sharesMsgHash(eid: bigint, sharesBlob: Uint8Array): Uint8Array {
  return sha256(
    concatBytes(
      new TextEncoder().encode("stellot:shares"),
      bigintToLE64(eid),
      sharesBlob,
    ),
  );
}

// ── Exponential ElGamal on secp256k1 ──────────────────────────────────────────

/**
 * Encrypt vote option v (0-indexed) under the combined KH public key.
 *
 * Encoding: (v+1)·G to avoid the point-at-infinity for v=0.
 *
 * @param v        vote option index (0-based)
 * @param pk33     33-byte compressed secp256k1 public key of the election
 * @returns        {c1, c2} encrypted ciphertext (33-byte points each)
 */
export function elgamalEncrypt(
  v: number,
  pk33: Uint8Array,
): ElGamalCiphertext {
  const r = secp256k1.utils.randomPrivateKey();
  const rBig = bytesToBigInt(r);

  // C1 = r·G
  const C1 = secp256k1.ProjectivePoint.BASE.multiply(rBig);

  // C2 = (v+1)·G + r·PK
  const PK = secp256k1.ProjectivePoint.fromHex(pk33);
  const vPlus1 = secp256k1.ProjectivePoint.BASE.multiply(BigInt(v + 1));
  const rPK = PK.multiply(rBig);
  const C2 = vPlus1.add(rPK);

  return {
    c1: C1.toRawBytes(true),
    c2: C2.toRawBytes(true),
  };
}

/**
 * Partially decrypt: D_j = C1^sk_j (additive notation: sk_j · C1)
 */
export function partialDecrypt(
  c1bytes: Uint8Array,
  skj: bigint,
): Uint8Array {
  const C1 = secp256k1.ProjectivePoint.fromHex(c1bytes);
  return C1.multiply(skj).toRawBytes(true);
}

/**
 * Combine partial decryptions using Lagrange interpolation.
 *
 * @param shares  Map from KH index (1-based) to D_ji compressed point bytes
 * @param t       threshold
 * @returns       combined decryption point D = sk · C1
 */
export function lagrangeCombine(
  shares: Map<number, Uint8Array>,
): Uint8Array {
  const indices = [...shares.keys()];

  let result = secp256k1.ProjectivePoint.ZERO;

  for (const j of indices) {
    // Lagrange coefficient λ_j = ∏_{k≠j}(k / (k-j)) mod Q  (over Z_q)
    let num = 1n;
    let den = 1n;
    for (const k of indices) {
      if (k === j) continue;
      num = modMul(num, BigInt(k), Q);
      den = modMul(den, BigInt(k - j), Q);
    }
    const lambda = modDiv(num, den, Q);
    const Dj = secp256k1.ProjectivePoint.fromHex(shares.get(j)!);
    result = result.add(Dj.multiply(lambda));
  }

  return result.toRawBytes(true);
}

/**
 * Decrypt a single ciphertext given the combined decryption point D = sk·C1.
 *
 * V = C2 - D = (v+1)·G
 * Brute-force DLOG: try 1·G, 2·G, … up to maxOptions.
 *
 * @returns vote option index (0-based), or -1 if not found
 */
export function elgamalDecrypt(
  c2bytes: Uint8Array,
  Dbytes: Uint8Array,
  maxOptions: number,
): number {
  const C2 = secp256k1.ProjectivePoint.fromHex(c2bytes);
  const D = secp256k1.ProjectivePoint.fromHex(Dbytes);
  const V = C2.subtract(D);
  const Vhex = bytesToHex(V.toRawBytes(true));

  // Brute-force: V = (v+1)·G → try v+1 from 1 to maxOptions
  let acc = secp256k1.ProjectivePoint.BASE; // 1·G
  for (let vp1 = 1; vp1 <= maxOptions; vp1++) {
    if (bytesToHex(acc.toRawBytes(true)) === Vhex) {
      return vp1 - 1;
    }
    acc = acc.add(secp256k1.ProjectivePoint.BASE);
  }
  return -1;
}

// ── Serialise shares blob (mirrors Rust serialise_shares) ─────────────────────

/**
 * Serialise a Vec<(c1, d)> to the same format as the Rust contract:
 * [count u32_le] then pairs of [len u32_le][bytes][len u32_le][bytes]
 */
export function serialiseShares(
  shares: Array<[Uint8Array, Uint8Array]>,
): Uint8Array {
  const parts: Uint8Array[] = [];
  parts.push(u32LE(shares.length));
  for (const [c1, d] of shares) {
    parts.push(u32LE(c1.length));
    parts.push(c1);
    parts.push(u32LE(d.length));
    parts.push(d);
  }
  return concatBytes(...parts);
}

/**
 * Deserialise a shares blob (produced by serialiseShares / the Rust contract)
 * back into an array of (c1, D_j) pairs.
 */
export function deserialiseShares(blob: Uint8Array): Array<[Uint8Array, Uint8Array]> {
  let off = 0;
  const readU32 = () => {
    const v = blob[off] | (blob[off+1] << 8) | (blob[off+2] << 16) | (blob[off+3] << 24);
    off += 4;
    return v >>> 0; // unsigned
  };
  const count = readU32();
  const result: Array<[Uint8Array, Uint8Array]> = [];
  for (let i = 0; i < count; i++) {
    const c1Len = readU32();
    const c1 = blob.slice(off, off + c1Len); off += c1Len;
    const dLen = readU32();
    const d = blob.slice(off, off + dLen); off += dLen;
    result.push([c1, d]);
  }
  return result;
}

// ── Utility ────────────────────────────────────────────────────────────────────

function bigintToLE64(n: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  let rem = n;
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(rem & 0xffn);
    rem >>= 8n;
  }
  return buf;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let n = 0n;
  for (const b of bytes) {
    n = (n << 8n) | BigInt(b);
  }
  return n;
}

function modMul(a: bigint, b: bigint, m: bigint): bigint {
  return ((a * b) % m + m) % m;
}

function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n;
  base = ((base % m) + m) % m;
  while (exp > 0n) {
    if (exp & 1n) result = modMul(result, base, m);
    base = modMul(base, base, m);
    exp >>= 1n;
  }
  return result;
}

function modInv(a: bigint, m: bigint): bigint {
  return modPow(((a % m) + m) % m, m - 2n, m);
}

function modDiv(a: bigint, b: bigint, m: bigint): bigint {
  return modMul(a, modInv(b, m), m);
}

function u32LE(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = n & 0xff;
  buf[1] = (n >> 8) & 0xff;
  buf[2] = (n >> 16) & 0xff;
  buf[3] = (n >> 24) & 0xff;
  return buf;
}

// Re-export for convenience
export { Q as SECP256K1_ORDER };
