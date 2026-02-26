"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getElection,
  getBallotCount,
  getBallot,
  getKhShares,
  getTally,
  postShare,
  finalizeTally,
  ElectionInfo,
} from "@/lib/contract";
import {
  partialDecrypt,
  elgamalDecrypt,
  serialiseShares,
  sharesMsgHash,
  ed25519Sign,
  bytesToHex,
  hexToBytes,
} from "@/lib/crypto";
import { combinePartialDecryptions } from "@/lib/threshold";
import { getSessionKeypair, loadOrganizerSession } from "@/lib/wallet";
import { secp256k1 } from "@noble/curves/secp256k1";

const SECP_Q = secp256k1.CURVE.n;

function hexToBigInt(hex: string): bigint {
  return BigInt("0x" + hex);
}

export default function TallyPage() {
  const { id } = useParams() as { id: string };
  const eid = BigInt(id);

  const [election, setElection] = useState<ElectionInfo | null>(null);
  const [ballotCount, setBallotCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [tally, setTally] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const orgSession = typeof window !== "undefined"
    ? loadOrganizerSession(Number(eid))
    : null;

  useEffect(() => {
    async function load() {
      try {
        const [info, count] = await Promise.all([
          getElection(eid),
          getBallotCount(eid),
        ]);
        setElection(info);
        setBallotCount(count);
        if (info) {
          // Count how many KH shares are on-chain
          let sc = 0;
          const khRosterSize = 3; // approximate; could query from contract
          for (let i = 0; i < khRosterSize; i++) {
            const blob = await getKhShares(eid, i);
            if (blob) sc++;
          }
          setShareCount(sc);
        }
        const storedTally = await getTally(eid);
        if (storedTally) setTally(storedTally);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eid]);

  async function handlePostShares() {
    if (!orgSession || !election) return;
    setError(null);
    setStatus(null);
    setProcessing(true);

    try {
      // Fetch all ballots
      setStatus("Fetching ballots…");
      const ballots = [];
      for (let i = 0; i < ballotCount; i++) {
        const b = await getBallot(eid, i);
        if (b) ballots.push(b);
      }

      // For each KH, compute partial decryptions and post
      const kp = getSessionKeypair();

      for (const khShare of orgSession.khShares) {
        setStatus(`Posting shares for KH ${khShare.index}…`);
        const skBig = hexToBigInt(khShare.sk);

        const shares: Array<[Uint8Array, Uint8Array]> = ballots.map((b) => {
          const Dji = partialDecrypt(b.c1, skBig);
          return [b.c1, Dji];
        });

        // Sign the shares blob with the KH's real Ed25519 identity key
        const blob = serialiseShares(shares);
        const msgHash = sharesMsgHash(eid, blob);
        const khEdSk = hexToBytes(khShare.edSk);
        const khEdPk = hexToBytes(khShare.edPk);
        const sig = ed25519Sign(khEdSk, msgHash);

        await postShare(kp, eid, khShare.index - 1, shares, khEdPk, sig);
      }

      setStatus("All shares posted.");
      setShareCount(orgSession.khShares.length);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setProcessing(false);
    }
  }

  async function handleComputeTally() {
    if (!orgSession || !election) return;
    setError(null);
    setStatus(null);
    setProcessing(true);

    try {
      setStatus("Fetching ballots…");
      const ballots = [];
      for (let i = 0; i < ballotCount; i++) {
        const b = await getBallot(eid, i);
        if (b) ballots.push(b);
      }

      setStatus("Computing partial decryptions…");
      // Collect partial decryptions per ballot, from each KH
      const allDecryptions: Array<Map<number, Uint8Array>> = ballots.map(
        () => new Map(),
      );

      for (const khShare of orgSession.khShares) {
        const skBig = hexToBigInt(khShare.sk);
        for (let i = 0; i < ballots.length; i++) {
          const Dji = partialDecrypt(ballots[i].c1, skBig);
          allDecryptions[i].set(khShare.index, Dji);
        }
      }

      setStatus("Running Lagrange interpolation…");
      const counts = new Array(election.optionsCount).fill(0);

      for (let i = 0; i < ballots.length; i++) {
        const Di = combinePartialDecryptions(allDecryptions[i]);
        const vote = elgamalDecrypt(ballots[i].c2, Di, election.optionsCount);
        if (vote >= 0 && vote < election.optionsCount) {
          counts[vote]++;
        }
      }

      setStatus("Submitting tally to contract…");
      const kp = getSessionKeypair();
      await finalizeTally(kp, eid, counts);

      setTally(counts);
      setStatus("Tally finalized!");
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (!election) return <div className="container"><p className="error">Election not found.</p></div>;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isClosed = now >= election.endTime;
  const khThreshold = orgSession ? orgSession.khShares.length : 1; // PoC: all KHs post
  const optionLabels = Array.from(
    { length: election.optionsCount },
    (_, i) => `Option ${String.fromCharCode(65 + i)}`,
  );
  const maxVotes = tally ? Math.max(...tally, 1) : 1;

  return (
    <>
      <nav>
        <span className="brand">Stellot†</span>
        <Link href="/">Elections</Link>
        <Link href={`/elections/${id}`}>Election</Link>
      </nav>
      <div className="container">
        <h1>{election.title} — Tally</h1>

        {error && <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>}
        {status && <p className="success" style={{ marginBottom: "1rem" }}>{status}</p>}

        {/* Tally results */}
        {tally && (
          <div className="card">
            <h2>Results</h2>
            <div className="bar-chart" style={{ marginTop: "1rem" }}>
              {optionLabels.map((label, i) => (
                <div key={i} className="bar-row">
                  <span className="bar-label">{label}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(tally[i] / maxVotes) * 100}%` }}
                    />
                  </div>
                  <span className="bar-count">{tally[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KH secrets — visible to the organizer so keys can be verified / backed up */}
        {orgSession && (
          <div className="card" style={{ borderColor: "#554" }}>
            <h3>Key Holder Secrets <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "#888" }}>(this browser only — copy to back up)</span></h3>
            <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {orgSession.khShares.map((kh) => (
                <div key={kh.index} style={{ padding: "0.5rem 0.75rem", background: "#1a1a1a", borderRadius: "6px", border: "1px solid #333" }}>
                  <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "0.3rem" }}>KH {kh.index}</p>
                  <p style={{ fontSize: "0.72rem" }}>
                    <span style={{ color: "#888" }}>secp sk: </span>
                    <span className="mono" style={{ color: "#6af", wordBreak: "break-all" }}>{kh.sk}</span>
                  </p>
                  <p style={{ fontSize: "0.72rem", marginTop: "0.2rem" }}>
                    <span style={{ color: "#888" }}>ed25519 pk: </span>
                    <span className="mono" style={{ color: "#aaa", wordBreak: "break-all" }}>{kh.edPk}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Organizer controls */}
        {orgSession && isClosed && !election.tallied && (
          <div className="card">
            <h2>Organizer Controls</h2>
            <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1rem" }}>
              You are the organizer. Post decryption shares from all {orgSession.khShares.length} key-holders,
              then compute and finalize the tally.
            </p>
            <p>
              Shares posted: {shareCount} / {orgSession.khShares.length}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                className="btn btn-primary"
                onClick={handlePostShares}
                disabled={processing || shareCount >= orgSession.khShares.length}
              >
                {processing ? "Posting…" : "Post Decryption Shares"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleComputeTally}
                disabled={processing || shareCount < orgSession.khShares.length}
              >
                {processing ? "Computing…" : "Compute &amp; Finalize Tally"}
              </button>
            </div>
          </div>
        )}

        {!isClosed && (
          <div className="card">
            <p>Voting is still in progress. Come back after {new Date(Number(election.endTime) * 1000).toLocaleString()}.</p>
          </div>
        )}

        {/* Info */}
        <div className="card" style={{ borderColor: "#333" }}>
          <h3>Decryption Protocol</h3>
          <p style={{ color: "#888", fontSize: "0.85rem" }}>
            Each key-holder computes D_ji = C1_i ^ sk_j (partial decryption).
            The combined decryption D_i = Lagrange({"{D_ji}"}) recovers (v+1)·G.
            Vote v is found by brute-force discrete-log search.
            Chaum-Pedersen proofs are generated off-chain for verification.
          </p>
        </div>
      </div>
    </>
  );
}
