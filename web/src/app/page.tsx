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
        <h1>Elections</h1>
        <p style={{ color: "#888", marginBottom: "1.5rem" }}>
          Threshold ElGamal e-voting on Stellar Soroban &mdash; <em>PoC</em>
        </p>

        {loading && <p>Loading elections from chain…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && elections.length === 0 && (
          <p>
            No elections found.{" "}
            <Link href="/elections/create">Create the first one.</Link>
          </p>
        )}

        {elections.map((e) => (
          <div key={e.eid.toString()} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2>
                  <Link href={`/elections/${e.eid}`}>{e.title}</Link>
                </h2>
                <p style={{ color: "#888", fontSize: "0.85rem" }}>
                  eid={e.eid.toString()} &middot; {e.optionsCount} options
                </p>
                <p style={{ color: "#888", fontSize: "0.85rem" }}>
                  {new Date(Number(e.startTime) * 1000).toLocaleString()} &rarr;{" "}
                  {new Date(Number(e.endTime) * 1000).toLocaleString()}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                {statusBadge(e)}
                {e.tallied && (
                  <Link href={`/elections/${e.eid}/tally`}>
                    <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem" }}>
                      Results
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/elections/create">
            <button className="btn btn-primary">+ Create Election</button>
          </Link>
        </div>
      </div>
    </>
  );
}
