"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
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
  deserialiseShares,
  sharesMsgHash,
  ed25519Sign,
  bytesToHex,
  hexToBytes,
} from "@/lib/crypto";
import { combinePartialDecryptions } from "@/lib/threshold";
import { getSessionKeypair } from "@/lib/wallet";

const MAX_KH = 10; // maximum slots to probe on-chain

function hexToBigInt(hex: string): bigint {
  return BigInt("0x" + hex);
}

export default function TallyPage() {
  const { id } = useParams() as { id: string };
  const eid = BigInt(id);

  const [election, setElection] = useState<ElectionInfo | null>(null);
  const [ballotCount, setBallotCount] = useState(0);
  const [postedSlots, setPostedSlots] = useState<number[]>([]); // 0-based slots with on-chain data
  const [tally, setTally] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Per-KH share submission form
  const [khIdx, setKhIdx] = useState("1");
  const [khSecpSk, setKhSecpSk] = useState("");
  const [khEdSk, setKhEdSk] = useState("");
  const [submittingShare, setSubmittingShare] = useState(false);

  // Tally computation
  const [computingTally, setComputingTally] = useState(false);

  useEffect(() => {
    load();
  }, [eid]);

  async function load() {
    try {
      const [info, count] = await Promise.all([getElection(eid), getBallotCount(eid)]);
      setElection(info);
      setBallotCount(count);
      if (info) {
        await refreshPostedSlots();
      }
      const storedTally = await getTally(eid);
      if (storedTally) setTally(storedTally);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function refreshPostedSlots() {
    const slots: number[] = [];
    for (let i = 0; i < MAX_KH; i++) {
      const blob = await getKhShares(eid, i);
      if (blob) slots.push(i);
    }
    setPostedSlots(slots);
    return slots;
  }

  async function handlePostMyShare() {
    setError(null);
    setStatus(null);
    setSubmittingShare(true);

    try {
      const idx = parseInt(khIdx);
      if (isNaN(idx) || idx < 1) throw new Error("KH index must be ≥ 1");
      if (!/^[0-9a-fA-F]{64}$/.test(khSecpSk.trim()))
        throw new Error("secp256k1 secret key must be 64 hex chars");
      if (!/^[0-9a-fA-F]{64}$/.test(khEdSk.trim()))
        throw new Error("Ed25519 secret key must be 64 hex chars");

      setStatus("Fetching ballots…");
      const ballots = [];
      for (let i = 0; i < ballotCount; i++) {
        const b = await getBallot(eid, i);
        if (b) ballots.push(b);
      }
      if (ballots.length === 0) throw new Error("No ballots cast yet");

      setStatus("Computing partial decryptions…");
      const skBig = hexToBigInt(khSecpSk.trim());
      const shares: Array<[Uint8Array, Uint8Array]> = ballots.map((b) => [
        b.c1,
        partialDecrypt(b.c1, skBig),
      ]);

      setStatus("Signing and posting shares…");
      const blob = serialiseShares(shares);
      const msgHash = sharesMsgHash(eid, blob);
      const edSkBytes = hexToBytes(khEdSk.trim());
      const edPkBytes = (await import("@noble/curves/ed25519")).ed25519.getPublicKey(edSkBytes);
      const sig = ed25519Sign(edSkBytes, msgHash);

      const kp = getSessionKeypair();
      await postShare(kp, eid, idx - 1, shares, edPkBytes, sig);

      setStatus("Share posted successfully.");
      await refreshPostedSlots();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSubmittingShare(false);
    }
  }

  async function handleComputeTally() {
    if (!election) return;
    setError(null);
    setStatus(null);
    setComputingTally(true);

    try {
      setStatus("Fetching ballots…");
      const ballots = [];
      for (let i = 0; i < ballotCount; i++) {
        const b = await getBallot(eid, i);
        if (b) ballots.push(b);
      }

      setStatus("Fetching on-chain decryption shares…");
      // allDji[ballotIdx] = Map<khLagrangeIdx (1-based), D_ji bytes>
      const allDji: Array<Map<number, Uint8Array>> = ballots.map(() => new Map());

      const slots = await refreshPostedSlots();
      for (const slot of slots) {
        const blob = await getKhShares(eid, slot);
        if (!blob) continue;
        const pairs = deserialiseShares(blob); // pairs[i] = (c1_i, D_ji)
        const lagrangeIdx = slot + 1; // on-chain slot 0 → KH index 1
        for (let i = 0; i < pairs.length && i < ballots.length; i++) {
          allDji[i].set(lagrangeIdx, pairs[i][1]);
        }
      }

      setStatus("Running Lagrange interpolation…");
      const counts = new Array(election.optionsCount).fill(0);
      for (let i = 0; i < ballots.length; i++) {
        if (allDji[i].size === 0) continue;
        const Di = combinePartialDecryptions(allDji[i]);
        const vote = elgamalDecrypt(ballots[i].c2, Di, election.optionsCount);
        if (vote >= 0 && vote < election.optionsCount) counts[vote]++;
      }

      setStatus("Submitting tally…");
      const kp = getSessionKeypair();
      await finalizeTally(kp, eid, counts);

      setTally(counts);
      setStatus("Tally finalized!");
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setComputingTally(false);
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (!election) return <div className="container"><p className="error">Election not found.</p></div>;

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isClosed = now >= election.endTime;
  const optionLabels = Array.from(
    { length: election.optionsCount },
    (_, i) => `Option ${String.fromCharCode(65 + i)}`,
  );
  const maxVotes = tally ? Math.max(...tally, 1) : 1;

  return (
    <>
      <Nav links={[{ href: "/", label: "Elections" }, { href: `/elections/${id}`, label: "Election" }]} />
      <div className="container">
        <h1>{election.title} — Tally</h1>

        {error && <p className="error" style={{ marginBottom: "1rem" }}>{error}</p>}
        {status && <p className="success" style={{ marginBottom: "1rem" }}>{status}</p>}

        {/* Results */}
        {tally && (
          <div className="card">
            <h2>Results</h2>
            <div className="bar-chart" style={{ marginTop: "1rem" }}>
              {optionLabels.map((label, i) => (
                <div key={i} className="bar-row">
                  <span className="bar-label">{label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(tally[i] / maxVotes) * 100}%` }} />
                  </div>
                  <span className="bar-count">{tally[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share status */}
        {isClosed && !election.tallied && (
          <>
            <div className="card">
              <h2>Submit Your Decryption Share</h2>
              <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Key holders: paste your credentials (from the JSON file you received) and submit
                your partial decryption. Each key holder does this independently.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>KH Index</label>
                  <input
                    type="number"
                    min={1}
                    max={MAX_KH}
                    value={khIdx}
                    onChange={(e) => setKhIdx(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>secp256k1 secret key (64 hex chars)</label>
                    <input
                      placeholder="from your credential file: secpSk"
                      value={khSecpSk}
                      onChange={(e) => setKhSecpSk(e.target.value)}
                      style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem" }}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Ed25519 secret key (64 hex chars)</label>
                    <input
                      placeholder="from your credential file: edSk"
                      value={khEdSk}
                      onChange={(e) => setKhEdSk(e.target.value)}
                      style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem" }}
                    />
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handlePostMyShare}
                disabled={submittingShare}
              >
                {submittingShare ? "Posting…" : "Submit My Decryption Share"}
              </button>
            </div>

            <div className="card">
              <h2>Finalize Tally</h2>
              <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                Once enough key holders have submitted their shares, compute the final tally from
                the on-chain data.
              </p>
              <p style={{ marginBottom: "1rem" }}>
                Shares posted:{" "}
                <strong>{postedSlots.length}</strong>
                {postedSlots.length > 0 && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    {" "}(KH {postedSlots.map((s) => s + 1).join(", ")})
                  </span>
                )}
              </p>
              <button
                className="btn btn-secondary"
                onClick={handleComputeTally}
                disabled={computingTally || postedSlots.length === 0}
              >
                {computingTally ? "Computing…" : "Compute & Finalize Tally"}
              </button>
            </div>
          </>
        )}

        {!isClosed && (
          <div className="card">
            <p>Voting is still in progress. Come back after {new Date(Number(election.endTime) * 1000).toLocaleString()}.</p>
          </div>
        )}

        {/* Protocol note */}
        <div className="card">
          <h3>Decryption Protocol</h3>
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            Each key holder computes D<sub>j</sub> = C1<sup>sk<sub>j</sub></sup> per ballot and
            posts the result on-chain signed with their Ed25519 key. Once the threshold is met,
            the combined decryption D = Lagrange({"{D_j}"}) is computed and the vote
            (v+1)·G = C2 − D is recovered by brute-force discrete-log.
          </p>
        </div>
      </div>
    </>
  );
}
