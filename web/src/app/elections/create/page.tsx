"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { runDKG } from "@/lib/dkg";
import { buildTree } from "@/lib/merkle";
import { hexToBytes, bytesToHex } from "@/lib/crypto";
import { deployElection, setKhCommitment, fundAccountIfNeeded } from "@/lib/contract";
import { getSessionKeypair, saveOrganizerSession } from "@/lib/wallet";
import { ed25519 } from "@noble/curves/ed25519";

interface GeneratedKeypair {
  pk: string;
  sk: string;
}

interface KHCredential {
  index: number;   // 1-based
  sk: string;      // secp256k1 secret scalar (hex)
  edSk: string;    // Ed25519 secret key (hex)
  edPk: string;    // Ed25519 public key (hex)
}

interface DeployedElection {
  eid: bigint;
  khCredentials: KHCredential[];
  distSk: string;
}

export default function CreateElectionPage() {
  const [title, setTitle] = useState("My Election");
  const [options, setOptions] = useState(["Option A", "Option B"]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eligibleVoters, setEligibleVoters] = useState(
    "# Paste Ed25519 pubkeys (hex, one per line)\n",
  );
  const [numKH, setNumKH] = useState(3);
  const [khThreshold, setKhThreshold] = useState(2);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatedKeypairs, setGeneratedKeypairs] = useState<GeneratedKeypair[]>([]);

  // Set after successful deploy — switches to credentials view
  const [deployed, setDeployed] = useState<DeployedElection | null>(null);

  function generateTestKeypair() {
    const sk = ed25519.utils.randomPrivateKey();
    const pk = ed25519.getPublicKey(sk);
    const skHex = bytesToHex(sk);
    const pkHex = bytesToHex(pk);
    setGeneratedKeypairs((prev) => [...prev, { pk: pkHex, sk: skHex }]);
    setEligibleVoters((prev) => {
      const lines = prev.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
      return `# Paste Ed25519 pubkeys (hex, one per line)\n${[...lines, pkHex].join("\n")}\n`;
    });
  }

  function addOption() {
    setOptions([...options, `Option ${String.fromCharCode(65 + options.length)}`]);
  }

  function removeOption(i: number) {
    setOptions(options.filter((_, idx) => idx !== i));
  }

  function downloadKH(kh: KHCredential, eid: bigint) {
    const payload = JSON.stringify(
      { eid: eid.toString(), khIndex: kh.index, secpSk: kh.sk, edSk: kh.edSk, edPk: kh.edPk },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stellot-kh${kh.index}-eid${eid}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit() {
    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      // 1. Parse eligible voters
      const voterHexes = eligibleVoters
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      if (voterHexes.length === 0) throw new Error("At least one eligible voter is required");

      const voterPubkeys = voterHexes.map((h) => {
        if (!/^[0-9a-fA-F]{64}$/.test(h))
          throw new Error(`Invalid pubkey hex (must be 64 hex chars): ${h}`);
        return hexToBytes(h);
      });

      setStatus("Building Merkle tree…");
      const { root } = buildTree(voterPubkeys);

      // 2. Run DKG
      setStatus(`Running Feldman VSS DKG (${numKH}-of-${khThreshold})…`);
      const dkgOut = runDKG(numKH, khThreshold);

      // 3. Distributor keypair (single key for PoC)
      const distSk = ed25519.utils.randomPrivateKey();
      const distPk = ed25519.getPublicKey(distSk);

      // 4. Fund + Deploy
      const kp = getSessionKeypair();
      setStatus("Funding account via Friendbot…");
      await fundAccountIfNeeded(kp.publicKey());
      setStatus("Deploying election contract…");
      const startTs = BigInt(Math.floor(new Date(startTime).getTime() / 1000));
      const endTs = BigInt(Math.floor(new Date(endTime).getTime() / 1000));

      const eid = await deployElection(kp, {
        title,
        optionsCount: options.length,
        startTime: startTs,
        endTime: endTs,
        encPubkey: dkgOut.combinedPubkey,
        eligibilityRoot: root,
        distRoster: [distPk],
        distThreshold: 1,
        khRoster: dkgOut.shares.map((s) => s.edPk),
        khThreshold,
      });

      // 5. Set per-KH commitments
      setStatus("Setting KH commitments…");
      for (let i = 0; i < dkgOut.shares.length; i++) {
        await setKhCommitment(kp, eid, i, dkgOut.shares[i].commitment);
      }

      // 6. Save full organizer session (for backward-compat / tally fallback)
      const distSkHex = bytesToHex(distSk);
      saveOrganizerSession({
        eid: Number(eid),
        distSk: distSkHex,
        distPk: bytesToHex(distPk),
        khShares: dkgOut.shares.map((s) => ({
          index: s.index,
          sk: s.sk.toString(16).padStart(64, "0"),
          commitment: bytesToHex(s.commitment),
          edSk: bytesToHex(s.edSk),
          edPk: bytesToHex(s.edPk),
        })),
        merkleLeaves: voterHexes,
        combinedPubkey: bytesToHex(dkgOut.combinedPubkey),
      });

      // 7. Show credentials — don't redirect, let the organizer copy/download keys
      setDeployed({
        eid,
        distSk: distSkHex,
        khCredentials: dkgOut.shares.map((s) => ({
          index: s.index,
          sk: s.sk.toString(16).padStart(64, "0"),
          edSk: bytesToHex(s.edSk),
          edPk: bytesToHex(s.edPk),
        })),
      });
      setStatus(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  // ── Credentials view (shown after successful deploy) ──────────────────────────
  if (deployed) {
    return (
      <>
        <Nav links={[{ href: "/", label: "Elections" }, { href: "/elections/create", label: "Create" }]} />
        <div className="container">
          <h1>Election Deployed</h1>
          <p style={{ color: "var(--text-dim)", marginBottom: "1.5rem" }}>
            eid={deployed.eid.toString()} — Distribute each key holder's credentials before
            navigating away. These keys cannot be recovered after you leave this page.
          </p>

          {/* Distributor key */}
          <div className="card card-amber">
            <h3>Distributor Key <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--text-dim)" }}>(share with voters so they can register)</span></h3>
            <div style={{ marginTop: "0.75rem" }}>
              <div className="key-box">
                <p className="key-box-label">Distributor secret key</p>
                <p className="mono key-sk">{deployed.distSk}</p>
              </div>
            </div>
          </div>

          {/* KH credentials */}
          <div className="card">
            <h2>Key Holder Credentials</h2>
            <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Send each key holder their own credential file. They will use it on the tally page
              to submit their partial decryption after voting closes.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {deployed.khCredentials.map((kh) => (
                <div key={kh.index} className="key-box" style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p className="key-box-label" style={{ marginBottom: 0 }}>Key Holder {kh.index}</p>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.25rem 0.65rem", letterSpacing: "0.02em", textTransform: "none" }}
                      onClick={() => downloadKH(kh, deployed.eid)}
                    >
                      ↓ Download JSON
                    </button>
                  </div>
                  <p style={{ fontSize: "0.72rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>secp256k1 sk: </span>
                    <span className="mono key-sk">{kh.sk}</span>
                  </p>
                  <p style={{ fontSize: "0.72rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>ed25519 sk: </span>
                    <span className="mono key-sk">{kh.edSk}</span>
                  </p>
                  <p style={{ fontSize: "0.72rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>ed25519 pk: </span>
                    <span className="mono key-pk">{kh.edPk}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Link href={`/elections/${deployed.eid}`}>
            <button className="btn btn-primary">Continue to Election →</button>
          </Link>
        </div>
      </>
    );
  }

  // ── Election creation form ────────────────────────────────────────────────────
  return (
    <>
      <Nav links={[{ href: "/", label: "Elections" }, { href: "/elections/create", label: "Create" }]} />
      <div className="container">
        <h1>Create Election</h1>

        <div className="card">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="field">
            <label>Options</label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.35rem" }}>
                <input
                  value={opt}
                  onChange={(ev) => {
                    const next = [...options];
                    next[i] = ev.target.value;
                    setOptions(next);
                  }}
                />
                {options.length > 2 && (
                  <button className="btn btn-danger" onClick={() => removeOption(i)}>✕</button>
                )}
              </div>
            ))}
            <button className="btn btn-secondary" onClick={addOption} style={{ marginTop: "0.35rem" }}>
              + Add Option
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="field">
              <label>Start Time</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field">
              <label>End Time</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Eligible Voters (Ed25519 pubkeys, 64 hex chars, one per line)</label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <textarea
                rows={5}
                style={{ flex: 1 }}
                value={eligibleVoters}
                onChange={(e) => setEligibleVoters(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={generateTestKeypair}
                title="Generate a test Ed25519 keypair and add its pubkey to the list"
                style={{ whiteSpace: "nowrap" }}
              >
                + Test Voter
              </button>
            </div>
            {generatedKeypairs.length > 0 && (
              <div style={{ marginTop: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.4rem" }}>
                  Generated keypairs — save the secret keys before leaving this page:
                </p>
                {generatedKeypairs.map((kp, i) => (
                  <div key={i} className="key-box">
                    <p className="key-box-label">Voter {i + 1}</p>
                    <p style={{ fontSize: "0.72rem", marginBottom: "0.15rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>pk: </span>
                      <span className="mono key-pk">{kp.pk}</span>
                    </p>
                    <p style={{ fontSize: "0.72rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>sk: </span>
                      <span className="mono key-sk">{kp.sk}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="field">
              <label>Key Holders (m)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={numKH}
                onChange={(e) => setNumKH(parseInt(e.target.value))}
              />
            </div>
            <div className="field">
              <label>KH Threshold (t)</label>
              <input
                type="number"
                min={1}
                max={numKH}
                value={khThreshold}
                onChange={(e) => setKhThreshold(parseInt(e.target.value))}
              />
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Deploying…" : "Deploy Election"}
          </button>

          {status && <p className="success" style={{ marginTop: "0.75rem" }}>{status}</p>}
          {error && <p className="error" style={{ marginTop: "0.75rem" }}>{error}</p>}
        </div>

        <div className="card card-amber">
          <h3>Cryptographic design</h3>
          <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
            The DKG runs Feldman VSS to derive a combined secp256k1 public key.
            The Merkle tree uses SHA-256 with domain separation
            (<code>stellot:leaf</code> / <code>stellot:node</code>).
            All crypto is real — no stubs.
          </p>
        </div>
      </div>
    </>
  );
}
