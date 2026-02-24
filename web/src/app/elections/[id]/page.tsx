"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getElection,
  getBallotCount,
  issueAccount,
  castBallot,
  ElectionInfo,
} from "@/lib/contract";
import {
  generateCastingKeypair,
  elgamalEncrypt,
  nullifierCast,
  issueMsgHash,
  castMsgHash,
  ed25519Sign,
  bytesToHex,
  hexToBytes,
} from "@/lib/crypto";
import { getSessionKeypair, loadOrganizerSession } from "@/lib/wallet";

export default function ElectionPage() {
  const { id } = useParams() as { id: string };
  const eid = BigInt(id);

  const [election, setElection] = useState<ElectionInfo | null>(null);
  const [ballotCount, setBallotCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [castNullifier, setCastNullifier] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // For the PoC: a voter provides their voter secret key (hex) to derive nullifiers
  const [voterSkHex, setVoterSkHex] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [info, count] = await Promise.all([
          getElection(eid),
          getBallotCount(eid),
        ]);
        setElection(info);
        setBallotCount(count);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eid]);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const isActive =
    election && !election.tallied && now >= election.startTime && now < election.endTime;

  async function handleVote(optionIndex: number) {
    if (!election) return;
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      // 1. Generate or load casting keypair
      const castKP = generateCastingKeypair();

      // 2. Issue the casting account (PoC: single distributor self-signs)
      //    In a real deployment the voter sends pk_cast + nf_issue to distributors.
      setStatus("Issuing casting account…");
      const voterSk = voterSkHex ? hexToBytes(voterSkHex) : castKP.sk;
      const nfIssue = new Uint8Array(32); // PoC: use zeros; real: nullifierIssue(voterSk, eid)

      // For the PoC we skip the real distributor step and directly call issue_account
      // with the organizer's distributor key (stored in session).
      const orgSession = loadOrganizerSession(Number(eid));
      const kp = getSessionKeypair();

      // Build issue msg and sign with a PoC distributor key
      // (In real flow the distributor does this independently)
      const issueMsg = issueMsgHash(eid, castKP.pk, nfIssue);
      const { ed25519: ed } = await import("@noble/curves/ed25519");
      const distSk = ed.utils.randomPrivateKey(); // PoC: per-vote random distributor key
      const distPk = ed.getPublicKey(distSk);
      const distSig = ed.sign(issueMsg, distSk);

      await issueAccount(kp, eid, castKP.pk, nfIssue, [
        { pk: distPk, sig: distSig },
      ]);

      // 3. Encrypt ballot
      setStatus("Encrypting ballot…");
      const cipher = elgamalEncrypt(optionIndex, election.encPubkey);

      // 4. Compute cast nullifier
      const nfCast = nullifierCast(castKP.sk, eid);

      // 5. Sign cast message
      const castMsg = castMsgHash(eid, nfCast, cipher.c1, cipher.c2);
      const castSig = ed25519Sign(castKP.sk, castMsg);

      // 6. Submit
      setStatus("Submitting ballot…");
      await castBallot(kp, eid, nfCast, cipher.c1, cipher.c2, castKP.pk, castSig);

      setCastNullifier(bytesToHex(nfCast));
      setVoted(true);
      setBallotCount((c) => c + 1);
      setStatus(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (!election) return <div className="container"><p className="error">Election not found.</p></div>;

  const options = Array.from({ length: election.optionsCount }, (_, i) => `Option ${String.fromCharCode(65 + i)}`);

  return (
    <>
      <nav>
        <span className="brand">Stellot†</span>
        <Link href="/">Elections</Link>
        <Link href="/elections/create">Create</Link>
      </nav>
      <div className="container">
        <h1>{election.title}</h1>
        <p style={{ color: "#888", marginBottom: "1rem" }}>
          eid={election.eid.toString()} &middot; {election.optionsCount} options &middot;{" "}
          {ballotCount} ballot(s) cast
        </p>
        <p style={{ color: "#888", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {new Date(Number(election.startTime) * 1000).toLocaleString()} &rarr;{" "}
          {new Date(Number(election.endTime) * 1000).toLocaleString()}
        </p>

        {election.tallied && (
          <div className="card" style={{ borderColor: "#7eb8f7" }}>
            <p>This election has been tallied.</p>
            <Link href={`/elections/${eid}/tally`}>
              <button className="btn btn-primary" style={{ marginTop: "0.5rem" }}>View Results</button>
            </Link>
          </div>
        )}

        {isActive && !voted && (
          <div className="card">
            <h2>Cast Your Vote</h2>
            <div className="field" style={{ marginTop: "0.75rem" }}>
              <label>Voter secret key (optional, 64 hex chars)</label>
              <input
                placeholder="Leave blank to use casting keypair directly"
                value={voterSkHex}
                onChange={(e) => setVoterSkHex(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
              {options.map((opt, i) => (
                <button
                  key={i}
                  className="btn btn-primary"
                  onClick={() => handleVote(i)}
                  disabled={submitting}
                >
                  {opt}
                </button>
              ))}
            </div>
            {status && <p className="success" style={{ marginTop: "0.75rem" }}>{status}</p>}
            {error && <p className="error" style={{ marginTop: "0.75rem" }}>{error}</p>}
          </div>
        )}

        {voted && castNullifier && (
          <div className="card" style={{ borderColor: "#4caf50" }}>
            <h2>Vote Cast</h2>
            <p>Your ballot has been encrypted and submitted.</p>
            <p style={{ marginTop: "0.5rem" }}>
              <strong>Cast nullifier:</strong>
            </p>
            <p className="mono" style={{ marginTop: "0.25rem" }}>{castNullifier}</p>
            <p style={{ color: "#888", fontSize: "0.82rem", marginTop: "0.5rem" }}>
              You can use this nullifier to verify your ballot is included.
            </p>
          </div>
        )}

        {!isActive && !election.tallied && (
          <div className="card">
            {now < election.startTime && <p>Voting has not started yet.</p>}
            {now >= election.endTime && (
              <>
                <p>Voting has closed.</p>
                {loadOrganizerSession(Number(eid)) && (
                  <Link href={`/elections/${eid}/tally`}>
                    <button className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
                      Post Shares &amp; Tally
                    </button>
                  </Link>
                )}
              </>
            )}
          </div>
        )}

        <div className="card" style={{ marginTop: "1rem", borderColor: "#333" }}>
          <h3>Combined KH Public Key</h3>
          <p className="mono" style={{ marginTop: "0.5rem" }}>
            {bytesToHex(election.encPubkey)}
          </p>
        </div>
      </div>
    </>
  );
}
