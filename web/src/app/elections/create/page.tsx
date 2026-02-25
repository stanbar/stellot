"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function CreateElectionPage() {
  const router = useRouter();

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

      if (voterHexes.length === 0) {
        throw new Error("At least one eligible voter is required");
      }

      const voterPubkeys = voterHexes.map((h) => {
        if (!/^[0-9a-fA-F]{64}$/.test(h)) {
          throw new Error(`Invalid pubkey hex (must be 64 hex chars): ${h}`);
        }
        return hexToBytes(h);
      });

      setStatus("Building Merkle tree…");
      const { root } = buildTree(voterPubkeys);

      // 2. Run DKG
      setStatus(`Running Feldman VSS DKG (${numKH}-of-${khThreshold})…`);
      const dkgOut = runDKG(numKH, khThreshold);

      // 3. Build distributor roster (for PoC: use a single in-memory key)
      //    In production each distributor manages their own key.
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

      // 6. Save organizer session
      saveOrganizerSession({
        eid: Number(eid),
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

      setStatus(`Election deployed! eid=${eid}`);
      setTimeout(() => router.push(`/elections/${eid}`), 1500);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <nav>
        <span className="brand">Stellot†</span>
        <Link href="/">Elections</Link>
        <Link href="/elections/create">Create</Link>
      </nav>
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
                  <button className="btn btn-danger" onClick={() => removeOption(i)}>
                    ✕
                  </button>
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
              <div style={{ marginTop: "0.5rem", padding: "0.65rem 0.85rem", background: "#1a1a1a", borderRadius: "6px", border: "1px solid #333" }}>
                <p style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "0.4rem" }}>
                  Generated keypairs — save the secret keys before leaving this page:
                </p>
                {generatedKeypairs.map((kp, i) => (
                  <div key={i} style={{ marginBottom: i < generatedKeypairs.length - 1 ? "0.65rem" : 0 }}>
                    <p style={{ fontSize: "0.72rem", color: "#888", marginBottom: "0.15rem" }}>Voter {i + 1}</p>
                    <p style={{ fontSize: "0.72rem", color: "#6af" }}>pk: <span className="mono">{kp.pk}</span></p>
                    <p style={{ fontSize: "0.72rem", color: "#fa6" }}>sk: <span className="mono">{kp.sk}</span></p>
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

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Deploying…" : "Deploy Election"}
          </button>

          {status && <p className="success" style={{ marginTop: "0.75rem" }}>{status}</p>}
          {error && <p className="error" style={{ marginTop: "0.75rem" }}>{error}</p>}
        </div>

        <div className="card" style={{ borderColor: "#554" }}>
          <h3>Cryptographic design</h3>
          <p style={{ color: "#888", fontSize: "0.85rem" }}>
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
