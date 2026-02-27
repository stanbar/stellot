"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import {
  getElection,
  getBallotCount,
  issueAccount,
  castBallot,
  isCastNullifierUsed,
  deleteElection,
  ElectionInfo,
} from "@/lib/contract";
import {
  generateCastingKeypair,
  elgamalEncrypt,
  nullifierCast,
  nullifierIssue,
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
  // Distributor key — auto-filled from organizer session; voter can paste it for cross-browser use
  const orgSession = typeof window !== "undefined" ? loadOrganizerSession(Number(eid)) : null;
  const [distSkHex, setDistSkHex] = useState(orgSession?.distSk ?? "");

  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Ballot verification
  const [verifyNullifier, setVerifyNullifier] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

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

      // 2. Issue the casting account
      setStatus("Issuing casting account…");
      const voterSk = voterSkHex ? hexToBytes(voterSkHex) : castKP.sk;
      // Unique per-voter nullifier derived from the voter's secret key
      const nfIssue = nullifierIssue(voterSk, eid);

      const kp = getSessionKeypair();

      if (!/^[0-9a-fA-F]{64}$/.test(distSkHex)) {
        throw new Error("Distributor key is required. Ask the election organizer for their distributor key.");
      }
      const { ed25519: ed } = await import("@noble/curves/ed25519");
      const distSk = hexToBytes(distSkHex);
      const distPk = ed.getPublicKey(distSk);

      const issueMsg = issueMsgHash(eid, castKP.pk, nfIssue);
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

  async function handleDelete() {
    if (!confirm(`Delete election "${election?.title}"? This cannot be undone.`)) return;
    setError(null);
    setDeleting(true);
    try {
      const kp = getSessionKeypair();
      await deleteElection(kp, eid);
      setDeleted(true);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setDeleting(false);
    }
  }

  async function handleVerify() {
    if (!/^[0-9a-fA-F]{64}$/.test(verifyNullifier.trim())) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const included = await isCastNullifierUsed(eid, hexToBytes(verifyNullifier.trim()));
      setVerifyResult(included);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (deleted) return (
    <><Nav links={[{ href: "/", label: "Elections" }]} />
    <div className="container"><p className="success">Election deleted. <a href="/">← Back to list</a></p></div></>
  );
  if (!election) return <div className="container"><p className="error">Election not found.</p></div>;

  const options = Array.from({ length: election.optionsCount }, (_, i) => `Option ${String.fromCharCode(65 + i)}`);

  return (
    <>
      <Nav links={[{ href: "/", label: "Elections" }, { href: "/elections/create", label: "Create" }]} />
      <div className="container">
        <h1>{election.title}</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
          eid={election.eid.toString()} &middot; {election.optionsCount} options &middot;{" "}
          {ballotCount} ballot(s) cast
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {new Date(Number(election.startTime) * 1000).toLocaleString()} &rarr;{" "}
          {new Date(Number(election.endTime) * 1000).toLocaleString()}
        </p>

        {election.tallied && (
          <div className="card card-blue">
            <p>This election has been tallied.</p>
            <Link href={`/elections/${eid}/tally`}>
              <button className="btn btn-primary" style={{ marginTop: "0.5rem" }}>View Results</button>
            </Link>
          </div>
        )}

        {/* Share distributor key with voters (organizer only) */}
        {orgSession && isActive && (
          <div className="card card-amber">
            <h3>Share with voters <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--text-dim)" }}>(organizer only)</span></h3>
            <p style={{ color: "var(--text-dim)", fontSize: "0.82rem", margin: "0.4rem 0" }}>
              Voters in other browsers need this distributor key to register their casting account.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Distributor key (sk):</p>
            <p className="mono key-sk" style={{ marginTop: "0.2rem" }}>
              {orgSession.distSk}
            </p>
          </div>
        )}

        {isActive && !voted && (
          <div className="card">
            <h2>Cast Your Vote</h2>
            <div className="field" style={{ marginTop: "0.75rem" }}>
              <label>Voter secret key (64 hex chars) — used to derive your unique issue nullifier</label>
              <input
                placeholder="Paste your voter secret key (from Create Election screen)"
                value={voterSkHex}
                onChange={(e) => setVoterSkHex(e.target.value)}
              />
            </div>
            {!orgSession && (
              <div className="field">
                <label>Distributor key (64 hex chars) — ask the election organizer</label>
                <input
                  placeholder="Paste the distributor secret key shared by the organizer"
                  value={distSkHex}
                  onChange={(e) => setDistSkHex(e.target.value)}
                />
              </div>
            )}

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
          <div className="card card-green">
            <h2>Vote Cast</h2>
            <p>Your ballot has been encrypted and submitted.</p>
            <p style={{ marginTop: "0.5rem" }}>
              <strong>Cast nullifier:</strong>
            </p>
            <p className="mono" style={{ marginTop: "0.25rem" }}>{castNullifier}</p>
            <p style={{ color: "var(--text-dim)", fontSize: "0.82rem", marginTop: "0.5rem" }}>
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
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  <Link href={`/elections/${eid}/tally`}>
                    <button className="btn btn-primary">Post Shares &amp; Tally</button>
                  </Link>
                  <button
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Permanently delete this election and all its data"
                  >
                    {deleting ? "Deleting…" : "Delete Election"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Verify Ballot Inclusion</h3>
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Paste your cast nullifier (shown after voting) to confirm your ballot is on-chain.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <input
              style={{ flex: 1, fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem" }}
              placeholder="cast nullifier (64 hex chars)"
              value={verifyNullifier}
              onChange={(e) => { setVerifyNullifier(e.target.value); setVerifyResult(null); }}
            />
            <button
              className="btn btn-secondary"
              onClick={handleVerify}
              disabled={verifying || !/^[0-9a-fA-F]{64}$/.test(verifyNullifier.trim())}
            >
              {verifying ? "Checking…" : "Verify"}
            </button>
          </div>
          {verifyResult === true && (
            <p style={{ marginTop: "0.5rem", color: "var(--success)" }}>✓ Ballot is included on-chain.</p>
          )}
          {verifyResult === false && (
            <p style={{ marginTop: "0.5rem", color: "var(--error)" }}>✗ Nullifier not found — ballot was not recorded.</p>
          )}
          {castNullifier && verifyNullifier === "" && (
            <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
              Your nullifier from this session:{" "}
              <button
                style={{ background: "none", border: "none", color: "var(--cornflower-light)", cursor: "pointer", fontFamily: "var(--font-mono, monospace)", fontSize: "0.8rem", padding: 0 }}
                onClick={() => setVerifyNullifier(castNullifier)}
              >
                {castNullifier.slice(0, 16)}…
              </button>
            </p>
          )}
        </div>

        <div className="card" style={{ marginTop: "1rem" }}>
          <h3>Combined KH Public Key</h3>
          <p className="mono" style={{ marginTop: "0.5rem" }}>
            {bytesToHex(election.encPubkey)}
          </p>
        </div>
      </div>
    </>
  );
}
