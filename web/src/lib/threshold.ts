/**
 * threshold.ts — Shamir secret sharing and Lagrange interpolation
 *
 * Used to:
 *  1. Combine partial decryptions D_ji into a full decryption D_i
 *  2. (Optionally) reconstruct the combined secret key from t shares
 *     (only needed for testing — never done in production)
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { SECP256K1_ORDER as Q } from "./crypto";

// ── Lagrange over Z_q ──────────────────────────────────────────────────────────

function modInv(a: bigint, m: bigint): bigint {
  // Fermat's little theorem (m is prime)
  return modPow(((a % m) + m) % m, m - 2n, m);
}

function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  let r = 1n;
  base = ((base % m) + m) % m;
  while (exp > 0n) {
    if (exp & 1n) r = (r * base) % m;
    base = (base * base) % m;
    exp >>= 1n;
  }
  return r;
}

/**
 * Lagrange coefficient λ_j(0) for the set S of party indices.
 * λ_j = ∏_{k ∈ S, k≠j} (k / (k - j)) mod Q
 */
export function lagrangeCoeff(j: number, S: number[]): bigint {
  let num = 1n;
  let den = 1n;
  for (const k of S) {
    if (k === j) continue;
    num = (num * BigInt(k)) % Q;
    den = (den * BigInt(k - j)) % Q;
  }
  return (num * modInv(den, Q)) % Q;
}

/**
 * Combine EC partial decryptions D_ji = C1 · sk_j into the full
 * decryption D_i = C1 · sk using Lagrange coefficients.
 *
 * @param shares  Map<partyIndex (1-based), D_ji as 33-byte compressed point>
 * @returns       D_i as 33-byte compressed point
 */
export function combinePartialDecryptions(
  shares: Map<number, Uint8Array>,
): Uint8Array {
  const S = [...shares.keys()];
  let result = secp256k1.ProjectivePoint.ZERO;

  for (const j of S) {
    const lambda = lagrangeCoeff(j, S);
    const Dj = secp256k1.ProjectivePoint.fromHex(shares.get(j)!);
    result = result.add(Dj.multiply(lambda));
  }

  return result.toRawBytes(true);
}

/**
 * Reconstruct the secret (scalar) from t Shamir shares.
 *
 * In production, the secret (combined sk) is NEVER reconstructed —
 * only EC partial decryptions are combined.  This function is provided
 * for testing and the DKG verification ceremony only.
 *
 * @param shares  Map<partyIndex (1-based), scalar share>
 * @returns       reconstructed secret scalar
 */
export function reconstructSecret(shares: Map<number, bigint>): bigint {
  const S = [...shares.keys()];
  let secret = 0n;

  for (const j of S) {
    const lambda = lagrangeCoeff(j, S);
    const sj = shares.get(j)!;
    secret = (secret + lambda * sj) % Q;
  }

  return (secret + Q) % Q;
}
