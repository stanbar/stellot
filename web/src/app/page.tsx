"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNextElectionId, getElection, ElectionInfo } from "@/lib/contract";

function statusBadge(info: ElectionInfo) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (info.tallied) return <span className="badge badge-tallied">Tallied</span>;
  if (now >= info.endTime) return <span className="badge badge-closed">Closed</span>;
  if (now < info.startTime) return <span className="badge badge-closed">Pending</span>;
  return <span className="badge badge-active">Active</span>;
}

const TAGS = [
  { label: "Feldman VSS DKG", accent: true },
  { label: "Threshold ElGamal", accent: true },
  { label: "Shamir Secret Sharing", accent: true },
  { label: "secp256k1", accent: false },
  { label: "Ed25519 Nullifiers", accent: false },
  { label: "Stellar Soroban", accent: false },
];

export default function HomePage() {
  const [elections, setElections] = useState<ElectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const count = await getNextElectionId();
        const items: ElectionInfo[] = [];
        for (let i = 0n; i < count; i++) {
          const info = await getElection(i);
          if (info) items.push(info);
        }
        setElections(items);
      } catch (e) {
        setError(`Failed to load elections: ${e}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <nav>
        <span className="brand">Stellot†</span>
        <Link href="/">Elections</Link>
        <Link href="/elections/create">Create</Link>
      </nav>

      <div className="container">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">Threshold E-Voting<br />on Stellar Soroban</h1>
          <p className="hero-sub">
            A cryptographically real PoC of the Stellot† protocol — no stubs,
            no shortcuts. Every primitive implemented for real.
          </p>
          <div className="hero-tags">
            {TAGS.map((t) => (
              <span key={t.label} className={`hero-tag${t.accent ? " hero-tag-accent" : ""}`}>
                {t.label}
              </span>
            ))}
          </div>
          <Link href="/elections/create">
            <button className="btn btn-primary" style={{ fontSize: "0.95rem", padding: "0.65rem 1.75rem" }}>
              + Create Election
            </button>
          </Link>
        </div>

        <hr className="hero-divider" />

        {/* Elections list */}
        <h2 style={{ marginBottom: "1rem" }}>Elections</h2>

        {loading && (
          <div className="card" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Loading elections from chain…
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {!loading && !error && elections.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
            <p style={{ color: "var(--text-dim)", marginBottom: "1rem" }}>No elections found.</p>
            <Link href="/elections/create">
              <button className="btn btn-primary">Create the first one</button>
            </Link>
          </div>
        )}

        {elections.map((e) => (
          <div key={e.eid.toString()} className="card">
            <div className="election-card">
              <div style={{ flex: 1 }}>
                <h2 style={{ marginBottom: "0.2rem" }}>
                  <Link href={`/elections/${e.eid}`} style={{ color: "inherit" }}>
                    {e.title}
                  </Link>
                </h2>
                <p className="election-meta">
                  eid={e.eid.toString()} &middot; {e.optionsCount} options
                </p>
                <p className="election-time">
                  {new Date(Number(e.startTime) * 1000).toLocaleString()} &rarr;{" "}
                  {new Date(Number(e.endTime) * 1000).toLocaleString()}
                </p>
              </div>
              <div className="election-actions">
                {statusBadge(e)}
                {e.tallied && (
                  <Link href={`/elections/${e.eid}/tally`}>
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}>
                      Results
                    </button>
                  </Link>
                )}
                <Link href={`/elections/${e.eid}`}>
                  <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "0.35rem 0.85rem" }}>
                    View
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
