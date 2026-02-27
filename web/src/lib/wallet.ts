/**
 * wallet.ts — Freighter wallet integration + in-memory fallback
 *
 * In a real deployment the user signs via the Freighter browser extension.
 * For the PoC / e2e tests we fall back to an in-memory Keypair seeded from
 * a session-stored private key.
 */

import { Keypair } from "@stellar/stellar-sdk";

// ── Session storage keys ──────────────────────────────────────────────────────

const SESSION_KEY = "stellot:keypair_seed";

// ── In-memory keypair (fallback) ──────────────────────────────────────────────

let _sessionKeypair: Keypair | null = null;

/**
 * Return the current session keypair.
 * Creates a new random one if none exists.
 */
export function getSessionKeypair(): Keypair {
  if (_sessionKeypair) return _sessionKeypair;

  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      _sessionKeypair = Keypair.fromSecret(stored);
      return _sessionKeypair;
    }
  }

  _sessionKeypair = Keypair.random();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, _sessionKeypair.secret());
  }
  return _sessionKeypair;
}

/**
 * Load a keypair from a known secret key (for scripts / e2e).
 */
export function keypairFromSecret(secret: string): Keypair {
  return Keypair.fromSecret(secret);
}

// ── Freighter detection ───────────────────────────────────────────────────────

export function isFreighterAvailable(): boolean {
  return typeof window !== "undefined" && !!(window as any).freighter;
}

/**
 * Request the Freighter public key (if available).
 */
export async function getFreighterPublicKey(): Promise<string | null> {
  if (!isFreighterAvailable()) return null;
  try {
    const { publicKey } = await (window as any).freighter.getPublicKey();
    return publicKey;
  } catch {
    return null;
  }
}

// ── Organiser / KH session data ───────────────────────────────────────────────

export interface OrganizerSession {
  eid: number;
  distSk: string;
  distPk: string;
  khShares: Array<{ index: number; sk: string; commitment: string; edSk: string; edPk: string }>;
  merkleLeaves: string[];
  combinedPubkey: string;
}

const ORGANISER_KEY = (eid: number) => `stellot:organizer:${eid}`;

export function saveOrganizerSession(data: OrganizerSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(ORGANISER_KEY(data.eid), JSON.stringify(data));
  }
}

export function loadOrganizerSession(eid: number): OrganizerSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ORGANISER_KEY(eid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrganizerSession;
  } catch {
    return null;
  }
}
