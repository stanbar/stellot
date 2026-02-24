/**
 * dkg.ts — Feldman VSS / DKG for the combined KH election key
 *
 * Each party j samples polynomial f_j of degree t-1 over Z_q:
 *   f_j(x) = a_j0 + a_j1*x + ... + a_j(t-1)*x^(t-1)
 *
 * Publishes commitments: A_jk = a_jk * G
 * Sends shares: s_ji = f_j(i)
 *
 * Combined public key: PK = sum_j(A_j0)
 *
 * For the PoC we simulate all parties locally; in production each party
 * would run independently over an authenticated channel.
 */

import { secp256k1 } from "@noble/curves/secp256k1";
import { SECP256K1_ORDER as Q } from "./crypto";

export interface KHShare {
  /** index in the roster (1-based, per Shamir convention) */
  index: number;
  /** Scalar sk_j (the Shamir share of the combined secret) */
  sk: bigint;
  /** 33-byte compressed A_j0 = a_j0 * G (constant-term commitment) */
  commitment: Uint8Array;
}

export interface DKGOutput {
  /** 33-byte compressed combined public key PK = sum(A_j0) */
  combinedPubkey: Uint8Array;
  /** Per-KH shares (one per party) */
  shares: KHShare[];
  /** All coefficient commitments: commitments[j][k] = A_jk */
  commitments: Uint8Array[][];
}

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

/**
 * Run a Feldman VSS DKG ceremony with `m` parties and threshold `t`.
 *
 * Returns the combined public key and each party's Shamir share of the
 * combined secret key (never reconstructed in full — only used for
 * partial decryption).
 */
export function runDKG(m: number, t: number): DKGOutput {
  if (t > m) throw new Error(`threshold t=${t} > parties m=${m}`);
  if (t < 1) throw new Error("threshold must be ≥ 1");

  // Step 1: Each party samples a degree-(t-1) polynomial
  const polynomials: bigint[][] = [];
  const allCommitments: Uint8Array[][] = [];

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
  }

  // Step 2: Each party verifies received shares (s_ji * G == sum_k(A_jk * i^k))
  // In a real protocol each s_ji is sent privately; here we check them all locally.
  for (let j = 0; j < m; j++) {
    for (let i = 1; i <= m; i++) {
      const s_ji = polyEval(polynomials[j], BigInt(i));
      const lhs = secp256k1.ProjectivePoint.BASE.multiply(s_ji);

      let rhs = secp256k1.ProjectivePoint.ZERO;
      for (let k = 0; k < t; k++) {
        const coeff_pt = secp256k1.ProjectivePoint.fromHex(allCommitments[j][k]);
        const ik = powMod(BigInt(i), BigInt(k), Q);
        rhs = rhs.add(coeff_pt.multiply(ik));
      }

      if (lhs.toHex() !== rhs.toHex()) {
        throw new Error(`VSS verification failed for party ${j}, evaluatee ${i}`);
      }
    }
  }

  // Step 3: Each party accumulates their received shares
  // sk_i = sum_j(f_j(i)) — the combined Shamir share for party i
  const khShares: KHShare[] = [];
  for (let i = 1; i <= m; i++) {
    let sk_i = 0n;
    for (let j = 0; j < m; j++) {
      sk_i = (sk_i + polyEval(polynomials[j], BigInt(i))) % Q;
    }
    khShares.push({
      index: i,
      sk: sk_i,
      commitment: allCommitments[i - 1][0], // A_{i-1,0}
    });
  }

  // Step 4: Combined public key = sum_j(A_j0) = sum_j(a_j0 * G)
  let PK = secp256k1.ProjectivePoint.ZERO;
  for (let j = 0; j < m; j++) {
    PK = PK.add(secp256k1.ProjectivePoint.fromHex(allCommitments[j][0]));
  }

  return {
    combinedPubkey: PK.toRawBytes(true),
    shares: khShares,
    commitments: allCommitments,
  };
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function bytesToBigInt(bytes: Uint8Array): bigint {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return n;
}

function powMod(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base %= mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}
