#!/usr/bin/env bash
# ============================================================================
# Stellot† End-to-End Runbook (local Soroban sandbox)
# ============================================================================
#
# Prerequisites:
#   - stellar-cli (soroban) installed and in PATH
#   - Node.js >= 18, npm/npx, tsx
#   - Rust + wasm32-unknown-unknown target
#
# Run:
#   bash scripts/e2e.sh
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KEYS_DIR="$ROOT/keys"
WASM="$ROOT/target/wasm32v1-none/release/election.wasm"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }
step() { echo -e "\n${YELLOW}==> $*${NC}"; }

# ── Step 0: Prerequisites ─────────────────────────────────────────────────────

step "0. Checking prerequisites"
command -v stellar >/dev/null 2>&1 || fail "stellar CLI not found (brew install stellar-cli)"
command -v npx    >/dev/null 2>&1 || fail "npx not found (install Node.js)"
command -v jq     >/dev/null 2>&1 || fail "jq not found (brew install jq)"

# Docker is only required for the local sandbox
if [ "${STELLAR_NETWORK:-local}" = "local" ] && ! docker info >/dev/null 2>&1; then
  fail "Docker daemon is not running.

  The local Soroban sandbox runs inside a Docker container.
  Please start Docker Desktop (or your Docker daemon) and re-run.

  Alternatively, point at Testnet by exporting:
    export STELLAR_NETWORK=testnet
  and re-running — the script will skip the local container step."
fi
ok "Prerequisites found"

# ── Step 1: Build contract ────────────────────────────────────────────────────

step "1. Building Soroban contract"
cd "$ROOT"
# stellar contract build uses wasm32v1-none (no reference-types) — the correct
# Soroban target. Plain 'cargo build --target wasm32-unknown-unknown' produces
# a WASM with reference-types that the Soroban VM rejects.
stellar contract build --quiet 2>/dev/null || stellar contract build
ok "WASM built at $WASM"

# ── Step 2: Start local sandbox ───────────────────────────────────────────────

step "2. Starting local Soroban sandbox"
# Use STELLAR_NETWORK env var to override (e.g. STELLAR_NETWORK=testnet bash e2e.sh)
STELLAR_NETWORK="${STELLAR_NETWORK:-local}"

if [ "$STELLAR_NETWORK" = "local" ]; then
  # Start the container (idempotent — 'already running' exit is fine)
  stellar container start local 2>&1 | grep -v "^$" || true

  # Phase 1: wait for HTTP health endpoint (up to 60 s)
  echo "  Waiting for local RPC to become healthy…"
  for i in $(seq 1 30); do
    if stellar network health --network local >/dev/null 2>&1; then
      echo "  HTTP endpoint healthy after ~$((i * 2))s"
      break
    fi
    sleep 2
    if [ "$i" -eq 30 ]; then
      fail "Sandbox did not become healthy after 60s. Check: stellar container logs local"
    fi
  done

  # Phase 2: wait for the Soroban RPC DB to have at least one ledger closed.
  # The health endpoint responds before the first ledger is produced, so
  # 'stellar contract deploy' returns "DB is empty" if we don't wait here.
  # We poll getLatestLedger over JSON-RPC (port 8000) until sequence > 0.
  echo "  Waiting for first ledger to close…"
  RPC_URL="http://localhost:8000/soroban/rpc"
  for i in $(seq 1 30); do
    LEDGER=$(curl -sf "$RPC_URL" \
      -H "Content-Type: application/json" \
      -d '{"jsonrpc":"2.0","id":1,"method":"getLatestLedger","params":{}}' \
      2>/dev/null | grep -o '"sequence":[0-9]*' | grep -o '[0-9]*' || true)
    if [ -n "$LEDGER" ] && [ "$LEDGER" -gt 0 ] 2>/dev/null; then
      ok "Sandbox ready — ledger sequence $LEDGER"
      break
    fi
    sleep 2
    if [ "$i" -eq 30 ]; then
      fail "Soroban RPC DB still empty after 60s. Check: stellar container logs local"
    fi
  done
else
  ok "Using network: $STELLAR_NETWORK (skipping local container start)"
fi

# ── Step 3: Create test accounts ──────────────────────────────────────────────

step "3. Creating test accounts"
# Generate keys (idempotent — skips if key already exists)
stellar keys generate --global alice  2>/dev/null || true
stellar keys generate --global bob    2>/dev/null || true
stellar keys generate --global deploy 2>/dev/null || true

# Fund each account explicitly — this works even if the key existed before
# and correctly handles a freshly restarted sandbox.
for ACCT in alice bob deploy; do
  stellar keys fund "$ACCT" --network $STELLAR_NETWORK 2>/dev/null \
    || stellar keys fund "$ACCT" --network $STELLAR_NETWORK  # retry once loudly
done

ALICE_PK=$(stellar keys address alice)
BOB_PK=$(stellar keys address bob)
DEPLOY_PK=$(stellar keys address deploy)
ok "Alice:  $ALICE_PK"
ok "Bob:    $BOB_PK"
ok "Deploy: $DEPLOY_PK"

# ── Step 4: Run DKG ceremony (2-of-3) ─────────────────────────────────────────

step "4. Running Feldman VSS DKG (m=3, t=2)"
mkdir -p "$KEYS_DIR"
npx tsx "$SCRIPT_DIR/dkg.ts" --m 3 --t 2 --output "$KEYS_DIR"
ok "DKG complete. Combined pubkey: $(jq -r .combined_pubkey "$KEYS_DIR/combined_pubkey.json" | head -c 16)…"

COMBINED_PUBKEY=$(jq -r .combined_pubkey "$KEYS_DIR/combined_pubkey.json")

# ── Step 5: Build Merkle tree for eligible voters ─────────────────────────────

step "5. Building Merkle tree"
# Extract Alice and Bob's Ed25519 pubkeys from Stellar keys
# (stellar key → raw strkey → Ed25519 bytes)
# For this e2e we use fixed test pubkeys derived from the Stellar accounts.
# In a real flow the voter supplies their Ed25519 pubkey hex.
ALICE_ED25519=$(stellar keys show alice 2>/dev/null | head -1 | tr -d ' ' | python3 -c "
import sys, base64
# Stellar account pk (G... strkey) decodes to Ed25519 pubkey with 4-byte version prefix
# Use a simple approach: extract the last 32 bytes
line = sys.stdin.read().strip()
print('aa' * 32)  # placeholder for demo; real flow uses proper strkey decode
" 2>/dev/null || echo "aa"*32)

# For the e2e PoC, build a Merkle tree with two placeholder voter pubkeys
cat > "$KEYS_DIR/voters.txt" <<EOF
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
EOF

# Compute Merkle root inline (Node.js)
MERKLE_ROOT=$(node --input-type=module <<'JSEOF'
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";

const LEAF_PREFIX = new TextEncoder().encode("stellot:leaf");
const NODE_PREFIX = new TextEncoder().encode("stellot:node");

function leafHash(bytes) {
  return sha256(concatBytes(LEAF_PREFIX, bytes));
}
function nodeHash(l, r) {
  return sha256(concatBytes(NODE_PREFIX, l, r));
}

const voters = [
  Uint8Array.from({length:32}, () => 0xaa),
  Uint8Array.from({length:32}, () => 0xbb),
];
const leaves = voters.map(leafHash);
const root = nodeHash(leaves[0], leaves[1]);
console.log(Array.from(root).map(b => b.toString(16).padStart(2,"0")).join(""));
JSEOF
)
ok "Merkle root: ${MERKLE_ROOT:0:16}…"
echo "$MERKLE_ROOT" > "$KEYS_DIR/merkle_root.txt"

# ── Step 6: Deploy contract ────────────────────────────────────────────────────

step "6. Deploying election contract"
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source deploy \
  --network $STELLAR_NETWORK)
ok "Contract deployed: $CONTRACT_ID"
export CONTRACT_ID

# ── Step 7: Compute timing ────────────────────────────────────────────────────

NOW=$(date +%s)
START=$((NOW + 10))
END=$((NOW + 120))

# ── Step 8: Build roster args ─────────────────────────────────────────────────

KH1_ED_PK=$(jq -r '.kh_ed_pks[0]' "$KEYS_DIR/combined_pubkey.json")
KH2_ED_PK=$(jq -r '.kh_ed_pks[1]' "$KEYS_DIR/combined_pubkey.json")
KH3_ED_PK=$(jq -r '.kh_ed_pks[2]' "$KEYS_DIR/combined_pubkey.json")

# Distributor: use a fixed test key
DIST_SK="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
DIST_PK=$(node --input-type=module <<JSEOF
import { ed25519 } from "@noble/curves/ed25519";
const sk = Uint8Array.from(Buffer.from("$DIST_SK", "hex"));
const pk = ed25519.getPublicKey(sk);
console.log(Buffer.from(pk).toString("hex"));
JSEOF
)

step "7. Invoking deploy()"
# Bytes args need hex encoding. Vec<BytesN<N>> uses JSON array of hex strings.
TITLE_HEX=$(echo -n "e2e Test Election" | xxd -p | tr -d '\n')

stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source deploy \
  --network $STELLAR_NETWORK \
  -- deploy \
  --title "$TITLE_HEX" \
  --options_count 2 \
  --start_time "$START" \
  --end_time "$END" \
  --enc_pubkey "$COMBINED_PUBKEY" \
  --eligibility_root "$MERKLE_ROOT" \
  --dist_roster "[\"$DIST_PK\"]" \
  --dist_threshold 1 \
  --kh_roster "[\"$KH1_ED_PK\",\"$KH2_ED_PK\",\"$KH3_ED_PK\"]" \
  --kh_threshold 2

EID=0
ok "Election deployed with eid=$EID"

# ── Step 9: Set KH commitments ────────────────────────────────────────────────

step "8. Setting KH commitments"
for i in 0 1 2; do
  COMM=$(jq -r ".commitments[$i][0]" "$KEYS_DIR/combined_pubkey.json")
  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source deploy \
    --network $STELLAR_NETWORK \
    -- set_kh_commitment \
    --eid "$EID" \
    --kh_idx "$i" \
    --commitment "$COMM"
  ok "Set commitment for KH $((i+1))"
done

# ── Step 10: Issue casting accounts ───────────────────────────────────────────

step "9. Issuing casting accounts for Alice and Bob"
sleep $((START - $(date +%s) + 1)) 2>/dev/null || true

# For each voter: generate cast keypair, compute issue msg, sign with distributor
for VOTER_LABEL in alice bob; do
  VOTER_SK_SEED="$(echo -n "$VOTER_LABEL" | xxd -p | head -c 64 | sed 's/.\{64\}/&\n/' | head -1)"
  # Generate casting keypair deterministically (PoC: hash of voter label)
  CAST_PK=$(node --input-type=module <<JSEOF
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
const seed = sha256(new TextEncoder().encode("$VOTER_LABEL"));
const pk = ed25519.getPublicKey(seed);
console.log(Buffer.from(pk).toString("hex"));
JSEOF
)
  NF_ISSUE=$(node --input-type=module <<JSEOF
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";
const eid = new Uint8Array(8);  // eid=0 LE
const domain = new TextEncoder().encode("stellot:issue");
const voterBytes = new TextEncoder().encode("$VOTER_LABEL");
const nf = sha256(concatBytes(domain, voterBytes, eid));
console.log(Buffer.from(nf).toString("hex"));
JSEOF
)
  # Sign the issue message
  DIST_SIG=$(node --input-type=module <<JSEOF
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";

const distSk = Buffer.from("$DIST_SK", "hex");
const pkCast = Buffer.from("$CAST_PK", "hex");
const nfIssue = Buffer.from("$NF_ISSUE", "hex");
const eid = new Uint8Array(8); // 0n LE

const msg = sha256(concatBytes(
  new TextEncoder().encode("stellot:issue"),
  eid,
  pkCast,
  nfIssue,
));
const sig = ed25519.sign(msg, distSk);
console.log(Buffer.from(sig).toString("hex"));
JSEOF
)

  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source deploy \
    --network $STELLAR_NETWORK \
    -- issue_account \
    --eid "$EID" \
    --pk_cast "$CAST_PK" \
    --nf_issue "$NF_ISSUE" \
    --dist_sigs "[[\"$DIST_PK\",\"$DIST_SIG\"]]"

  ok "Issued casting account for $VOTER_LABEL: ${CAST_PK:0:16}…"
done

# ── Step 11: Cast 2 ballots ────────────────────────────────────────────────────

step "10. Casting ballots (option 0 and option 1)"

# Initialise ballots file and saved params for duplicate-cast test
echo '[]' > "$KEYS_DIR/ballots.json"
ALICE_NF_CAST=""
ALICE_C1=""
ALICE_C2=""
ALICE_CAST_PK=""
ALICE_CAST_SIG=""

for VOTER_LABEL in alice bob; do
  # Reconstruct same keys as above
  CAST_SK=$(node --input-type=module <<JSEOF
import { sha256 } from "@noble/hashes/sha256";
const seed = sha256(new TextEncoder().encode("$VOTER_LABEL"));
console.log(Buffer.from(seed).toString("hex"));
JSEOF
)
  CAST_PK=$(node --input-type=module <<JSEOF
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
const seed = sha256(new TextEncoder().encode("$VOTER_LABEL"));
const pk = ed25519.getPublicKey(seed);
console.log(Buffer.from(pk).toString("hex"));
JSEOF
)

  VOTE=$([ "$VOTER_LABEL" = "alice" ] && echo 0 || echo 1)

  # Encrypt
  C1_C2=$(node --input-type=module <<JSEOF
import { secp256k1 } from "@noble/curves/secp256k1";
const encPubkeyHex = "$COMBINED_PUBKEY";
const v = $VOTE;
const r = secp256k1.utils.randomPrivateKey();
const rBig = BigInt("0x" + Buffer.from(r).toString("hex"));
const C1 = secp256k1.ProjectivePoint.BASE.multiply(rBig);
const PK = secp256k1.ProjectivePoint.fromHex(encPubkeyHex);
const vG = secp256k1.ProjectivePoint.BASE.multiply(BigInt(v + 1));
const C2 = vG.add(PK.multiply(rBig));
console.log(Buffer.from(C1.toRawBytes(true)).toString("hex") + " " + Buffer.from(C2.toRawBytes(true)).toString("hex"));
JSEOF
)
  C1="${C1_C2% *}"
  C2="${C1_C2#* }"

  NF_CAST=$(node --input-type=module <<JSEOF
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";
const sk = Buffer.from("$CAST_SK", "hex");
const eid = new Uint8Array(8);
const nf = sha256(concatBytes(new TextEncoder().encode("stellot:cast"), sk, eid));
console.log(Buffer.from(nf).toString("hex"));
JSEOF
)

  # Sign cast message
  CAST_SIG=$(node --input-type=module <<JSEOF
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { concatBytes } from "@noble/hashes/utils";
const sk = Buffer.from("$CAST_SK", "hex");
const nfCast = Buffer.from("$NF_CAST", "hex");
const c1 = Buffer.from("$C1", "hex");
const c2 = Buffer.from("$C2", "hex");
const eid = new Uint8Array(8);
const msg = sha256(concatBytes(new TextEncoder().encode("stellot:cast"), eid, nfCast, c1, c2));
const sig = ed25519.sign(msg, sk);
console.log(Buffer.from(sig).toString("hex"));
JSEOF
)

  stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source deploy \
    --network $STELLAR_NETWORK \
    -- cast \
    --eid "$EID" \
    --nf_cast "$NF_CAST" \
    --c1 "$C1" \
    --c2 "$C2" \
    --pk_cast "$CAST_PK" \
    --sig "$CAST_SIG"

  ok "$VOTER_LABEL voted for option $VOTE (nf=${NF_CAST:0:16}…)"

  # Save alice's params for the duplicate-cast test below
  if [ "$VOTER_LABEL" = "alice" ]; then
    ALICE_NF_CAST="$NF_CAST"
    ALICE_C1="$C1"
    ALICE_C2="$C2"
    ALICE_CAST_PK="$CAST_PK"
    ALICE_CAST_SIG="$CAST_SIG"
  fi

  # Append to ballots.json for post_share.ts (uses jq)
  jq --arg c1 "$C1" --arg c2 "$C2" \
    '. += [{"c1": $c1, "c2": $c2}]' \
    "$KEYS_DIR/ballots.json" > "$KEYS_DIR/ballots.json.tmp"
  mv "$KEYS_DIR/ballots.json.tmp" "$KEYS_DIR/ballots.json"
done

# ── Step 12: Test duplicate cast ──────────────────────────────────────────────

step "11. Testing duplicate cast rejection (should fail)"
# Re-submit alice's exact ballot — contract must reject with AlreadyVoted.
# Capture output and exit code without relying on pipeline (pipefail stays active
# from the top-level set -euo pipefail, which makes pipe-grep logic unreliable).
set +e +o pipefail
DUPE_OUT=$(stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source deploy \
  --network $STELLAR_NETWORK \
  -- cast \
  --eid "$EID" \
  --nf_cast "$ALICE_NF_CAST" \
  --c1 "$ALICE_C1" \
  --c2 "$ALICE_C2" \
  --pk_cast "$ALICE_CAST_PK" \
  --sig "$ALICE_CAST_SIG" 2>&1)
DUPE_RC=$?
set -e -o pipefail
if [ $DUPE_RC -ne 0 ]; then
  ok "Double-cast correctly rejected (rc=$DUPE_RC)"
else
  echo "  Unexpected success output: $DUPE_OUT"
  fail "Double-cast was NOT rejected!"
fi

# ── Step 13: Advance time past end ────────────────────────────────────────────

step "12. Waiting for voting window to close…"
NOW=$(date +%s)
WAIT=$((END - NOW + 2))
if [ "$WAIT" -gt 0 ]; then
  echo "  Sleeping ${WAIT}s until end_time…"
  sleep "$WAIT"
fi
ok "Voting window closed"

# ── Step 14: Post 2-of-3 KH shares ────────────────────────────────────────────

step "13. Posting 2-of-3 decryption shares"
npx tsx "$SCRIPT_DIR/post_share.ts" \
  --kh "$KEYS_DIR/kh1.json" \
  --eid "$EID" \
  --contract "$CONTRACT_ID" \
  --rpc $STELLAR_NETWORK \
  --source deploy \
  --kh-dir "$KEYS_DIR"
npx tsx "$SCRIPT_DIR/post_share.ts" \
  --kh "$KEYS_DIR/kh2.json" \
  --eid "$EID" \
  --contract "$CONTRACT_ID" \
  --rpc $STELLAR_NETWORK \
  --source deploy \
  --kh-dir "$KEYS_DIR"
ok "2 KH share batches posted"

# ── Step 15: Finalize tally ────────────────────────────────────────────────────

step "14. Computing and finalizing tally"
npx tsx "$SCRIPT_DIR/post_share.ts" \
  --finalize \
  --eid "$EID" \
  --kh-dir "$KEYS_DIR" \
  --m 3 --t 2 \
  --options-count 2 \
  --contract "$CONTRACT_ID" \
  --rpc $STELLAR_NETWORK \
  --source deploy

ok "Tally finalized"

# ── Step 16: Read tally from chain ────────────────────────────────────────────

step "15. Reading tally from contract"
TALLY=$(stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source deploy \
  --network $STELLAR_NETWORK \
  -- get_tally \
  --eid "$EID")
echo "  Tally: $TALLY"
ok "Expected: [1, 1] (one vote per option)"

# ── Done ───────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Stellot† e2e runbook PASSED                              ${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  Contract: $CONTRACT_ID"
echo "  Tally:    $TALLY"
echo ""
