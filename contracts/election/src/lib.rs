#![no_std]

mod error;
mod merkle;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contractimpl, contractmeta, symbol_short,
    Bytes, BytesN, Env, Vec,
};

use error::ContractError;
use types::{DataKey, ElectionParams, EncryptedBallot};

contractmeta!(
    key = "Description",
    val = "Stellot dagger - threshold ElGamal e-voting on Soroban (PoC)"
);

// ── Message construction helpers ──────────────────────────────────────────────

/// msg = SHA256("stellot:issue" || eid_le64 || pk_cast_32 || nf_issue_32)
fn issue_msg(env: &Env, eid: u64, pk_cast: &BytesN<32>, nf_issue: &BytesN<32>) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.extend_from_slice(b"stellot:issue");
    data.extend_from_slice(&eid.to_le_bytes());
    data.append(&pk_cast.into());
    data.append(&nf_issue.into());
    env.crypto().sha256(&data).into()
}

/// msg = SHA256("stellot:cast" || eid_le64 || nf_cast_32 || c1 || c2)
fn cast_msg(env: &Env, eid: u64, nf_cast: &BytesN<32>, c1: &Bytes, c2: &Bytes) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.extend_from_slice(b"stellot:cast");
    data.extend_from_slice(&eid.to_le_bytes());
    data.append(&nf_cast.into());
    data.append(c1);
    data.append(c2);
    env.crypto().sha256(&data).into()
}

/// msg = SHA256("stellot:shares" || eid_le64 || shares_blob)
fn shares_msg(env: &Env, eid: u64, shares_blob: &Bytes) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.extend_from_slice(b"stellot:shares");
    data.extend_from_slice(&eid.to_le_bytes());
    data.append(shares_blob);
    env.crypto().sha256(&data).into()
}

/// Serialise a shares batch to a flat byte blob for signing / storage.
/// Format: [pair_count u32_le] then pairs of [c1_len u32_le][c1][d_len u32_le][d]
pub fn serialise_shares(env: &Env, shares: &Vec<(Bytes, Bytes)>) -> Bytes {
    let mut out = Bytes::new(env);
    let len = shares.len();
    out.extend_from_slice(&len.to_le_bytes());
    for i in 0..len {
        let (c1, d) = shares.get(i).unwrap();
        out.extend_from_slice(&c1.len().to_le_bytes());
        out.append(&c1);
        out.extend_from_slice(&d.len().to_le_bytes());
        out.append(&d);
    }
    out
}

fn load_election(env: &Env, eid: u64) -> Result<ElectionParams, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::Election(eid))
        .ok_or(ContractError::NotFound)
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct ElectionContract;

#[contractimpl]
impl ElectionContract {
    // ── Stage 0: Deploy ───────────────────────────────────────────────────────

    /// Deploy a new election.  Returns the new election-id (eid).
    ///
    /// Soroban contracts are limited to 10 function parameters; KH VSS
    /// commitments are submitted via `set_kh_commitment()` after deployment.
    ///
    /// Parameters (10 total):
    /// 1. title            — UTF-8 bytes
    /// 2. options_count    — number of voting options (≥ 2)
    /// 3. start_time       — Unix timestamp (s)
    /// 4. end_time         — Unix timestamp (s)
    /// 5. enc_pubkey       — 33-byte compressed secp256k1 combined KH pubkey
    /// 6. eligibility_root — SHA256 Merkle root of eligible voter pubkey set
    /// 7. dist_roster      — distributor Ed25519 pubkeys (32-byte each)
    /// 8. dist_threshold   — M-of-N distributor threshold
    /// 9. kh_roster        — key-holder Ed25519 pubkeys (32-byte each)
    /// 10. kh_threshold    — t-of-m KH threshold
    pub fn deploy(
        env: Env,
        title: Bytes,
        options_count: u32,
        start_time: u64,
        end_time: u64,
        enc_pubkey: Bytes,
        eligibility_root: BytesN<32>,
        dist_roster: Vec<BytesN<32>>,
        dist_threshold: u32,
        kh_roster: Vec<BytesN<32>>,
        kh_threshold: u32,
    ) -> Result<u64, ContractError> {
        let eid: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::NextElectionId)
            .unwrap_or(0u64);

        let params = ElectionParams {
            eid,
            title,
            options_count,
            start_time,
            end_time,
            enc_pubkey,
            tallied: false,
        };

        env.storage().persistent().set(&DataKey::Election(eid), &params);
        env.storage().persistent().set(&DataKey::EligibleRoot(eid), &eligibility_root);
        env.storage().persistent().set(&DataKey::DistRoster(eid), &dist_roster);
        env.storage().persistent().set(&DataKey::DistThreshold(eid), &dist_threshold);
        env.storage().persistent().set(&DataKey::KhRoster(eid), &kh_roster);
        env.storage().persistent().set(&DataKey::KhThreshold(eid), &kh_threshold);
        env.storage().persistent().set(&DataKey::NextElectionId, &(eid + 1));

        env.events().publish(
            (symbol_short!("deploy"), eid),
            (params.start_time, params.end_time, params.options_count),
        );

        Ok(eid)
    }

    /// Submit a key-holder's VSS constant-term commitment A_j0.
    /// Called once per KH after deploy(), indexed by their position in kh_roster.
    pub fn set_kh_commitment(
        env: Env,
        eid: u64,
        kh_idx: u32,
        commitment: Bytes,
    ) -> Result<(), ContractError> {
        load_election(&env, eid)?;
        let kh_roster: Vec<BytesN<32>> = env
            .storage()
            .persistent()
            .get(&DataKey::KhRoster(eid))
            .unwrap();
        if kh_idx >= kh_roster.len() {
            return Err(ContractError::NotKeyHolder);
        }
        env.storage()
            .persistent()
            .set(&DataKey::KhCommitment(eid, kh_idx), &commitment);
        Ok(())
    }

    // ── Stage 1: Issue ────────────────────────────────────────────────────────

    /// Register a casting account after the distributor committee approves.
    ///
    /// Parameters:
    /// * eid       — election id
    /// * pk_cast   — 32-byte Ed25519 pubkey of the new casting account
    /// * nf_issue  — 32-byte issue nullifier
    /// * dist_sigs — Vec<(distributor_pk_32, ed25519_sig_64)>
    pub fn issue_account(
        env: Env,
        eid: u64,
        pk_cast: BytesN<32>,
        nf_issue: BytesN<32>,
        dist_sigs: Vec<(BytesN<32>, BytesN<64>)>,
    ) -> Result<(), ContractError> {
        load_election(&env, eid)?;

        if env.storage().persistent().has(&DataKey::IssueNullifier(eid, nf_issue.clone())) {
            return Err(ContractError::AlreadyIssued);
        }

        let dist_roster: Vec<BytesN<32>> = env
            .storage().persistent().get(&DataKey::DistRoster(eid)).unwrap();
        let dist_threshold: u32 = env
            .storage().persistent().get(&DataKey::DistThreshold(eid)).unwrap();

        let msg_hash = issue_msg(&env, eid, &pk_cast, &nf_issue);
        let msg_bytes: Bytes = msg_hash.into();

        let mut valid_count: u32 = 0;
        for i in 0..dist_sigs.len() {
            let (signer_pk, sig) = dist_sigs.get(i).unwrap();
            if !dist_roster.contains(&signer_pk) {
                continue;
            }
            env.crypto().ed25519_verify(&signer_pk, &msg_bytes, &sig);
            valid_count += 1;
        }

        if valid_count < dist_threshold {
            return Err(ContractError::InvalidDistributorSig);
        }

        env.storage().persistent()
            .set(&DataKey::IssueNullifier(eid, nf_issue.clone()), &true);
        env.storage().persistent()
            .set(&DataKey::CastingAccount(eid, pk_cast.clone()), &true);

        env.events()
            .publish((symbol_short!("issued"), eid), (nf_issue, pk_cast));

        Ok(())
    }

    // ── Stage 2: Cast ─────────────────────────────────────────────────────────

    /// Submit an encrypted ballot.
    ///
    /// Parameters:
    /// * eid     — election id
    /// * nf_cast — 32-byte cast nullifier
    /// * c1      — 33-byte compressed secp256k1 point (r·G)
    /// * c2      — 33-byte compressed secp256k1 point ((v+1)·G + r·PK)
    /// * pk_cast — 32-byte Ed25519 pubkey of the casting account
    /// * sig     — 64-byte Ed25519 signature over cast_msg(...)
    ///
    /// Returns the ballot index.
    pub fn cast(
        env: Env,
        eid: u64,
        nf_cast: BytesN<32>,
        c1: Bytes,
        c2: Bytes,
        pk_cast: BytesN<32>,
        sig: BytesN<64>,
    ) -> Result<u32, ContractError> {
        let params = load_election(&env, eid)?;

        let now = env.ledger().timestamp();
        if now < params.start_time || now >= params.end_time {
            return Err(ContractError::OutsideVotingWindow);
        }

        if env.storage().persistent().has(&DataKey::CastNullifier(eid, nf_cast.clone())) {
            return Err(ContractError::AlreadyVoted);
        }

        if !env.storage().persistent().has(&DataKey::CastingAccount(eid, pk_cast.clone())) {
            return Err(ContractError::NotIssuedAccount);
        }

        let msg_hash = cast_msg(&env, eid, &nf_cast, &c1, &c2);
        let msg_bytes: Bytes = msg_hash.into();
        env.crypto().ed25519_verify(&pk_cast, &msg_bytes, &sig);

        let ballot_count: u32 = env
            .storage().persistent().get(&DataKey::BallotCount(eid)).unwrap_or(0u32);

        env.storage().persistent()
            .set(&DataKey::Ballot(eid, ballot_count), &EncryptedBallot {
                nf_cast: nf_cast.clone(),
                c1,
                c2,
            });
        env.storage().persistent()
            .set(&DataKey::BallotCount(eid), &(ballot_count + 1));
        env.storage().persistent()
            .set(&DataKey::CastNullifier(eid, nf_cast.clone()), &true);

        env.events()
            .publish((symbol_short!("cast"), eid), (nf_cast, ballot_count));

        Ok(ballot_count)
    }

    // ── Stage 3a: Post Shares ─────────────────────────────────────────────────

    /// A key-holder posts their batch of partial decryption shares.
    ///
    /// Parameters:
    /// * eid     — election id
    /// * kh_idx  — index of this KH in kh_roster
    /// * shares  — Vec<(c1_compressed_bytes, D_ji_compressed_bytes)> one per ballot
    /// * kh_pk   — 32-byte Ed25519 pubkey (must match kh_roster[kh_idx])
    /// * sig     — 64-byte Ed25519 signature over shares_msg(...)
    ///
    /// Returns the cumulative share count.
    pub fn post_share(
        env: Env,
        eid: u64,
        kh_idx: u32,
        shares: Vec<(Bytes, Bytes)>,
        kh_pk: BytesN<32>,
        sig: BytesN<64>,
    ) -> Result<u32, ContractError> {
        let params = load_election(&env, eid)?;

        let now = env.ledger().timestamp();
        if now < params.end_time {
            return Err(ContractError::OutsideVotingWindow);
        }

        if params.tallied {
            return Err(ContractError::AlreadyTallied);
        }

        let kh_roster: Vec<BytesN<32>> = env
            .storage().persistent().get(&DataKey::KhRoster(eid)).unwrap();
        if kh_idx >= kh_roster.len() || kh_roster.get(kh_idx).unwrap() != kh_pk {
            return Err(ContractError::NotKeyHolder);
        }

        if env.storage().persistent().has(&DataKey::KhShare(eid, kh_idx)) {
            return Err(ContractError::AlreadyPosted);
        }

        let shares_blob = serialise_shares(&env, &shares);
        let msg_hash = shares_msg(&env, eid, &shares_blob);
        let msg_bytes: Bytes = msg_hash.into();
        env.crypto().ed25519_verify(&kh_pk, &msg_bytes, &sig);

        env.storage().persistent()
            .set(&DataKey::KhShare(eid, kh_idx), &shares_blob);

        let share_count: u32 = env
            .storage().persistent().get(&DataKey::ShareCount(eid)).unwrap_or(0u32);
        let new_count = share_count + 1;
        env.storage().persistent().set(&DataKey::ShareCount(eid), &new_count);

        let kh_threshold: u32 = env
            .storage().persistent().get(&DataKey::KhThreshold(eid)).unwrap();
        if new_count >= kh_threshold {
            env.events().publish((symbol_short!("threshold"), eid), new_count);
        }

        Ok(new_count)
    }

    // ── Stage 3b: Finalize Tally ──────────────────────────────────────────────

    /// Finalise the tally after ≥ kh_threshold shares have been posted.
    /// Tally computation happens off-chain; this stores and verifies the result shape.
    pub fn finalize_tally(
        env: Env,
        eid: u64,
        tally: Vec<u32>,
    ) -> Result<(), ContractError> {
        let mut params = load_election(&env, eid)?;

        if params.tallied {
            return Err(ContractError::AlreadyTallied);
        }

        let now = env.ledger().timestamp();
        if now < params.end_time {
            return Err(ContractError::OutsideVotingWindow);
        }

        let share_count: u32 = env
            .storage().persistent().get(&DataKey::ShareCount(eid)).unwrap_or(0);
        let kh_threshold: u32 = env
            .storage().persistent().get(&DataKey::KhThreshold(eid)).unwrap();
        if share_count < kh_threshold {
            return Err(ContractError::InsufficientShares);
        }

        if tally.len() != params.options_count {
            return Err(ContractError::InvalidTally);
        }

        env.storage().persistent().set(&DataKey::Tally(eid), &tally);

        params.tallied = true;
        env.storage().persistent().set(&DataKey::Election(eid), &params);

        env.events().publish((symbol_short!("tallied"), eid), share_count);

        Ok(())
    }

    // ── Read-only views ───────────────────────────────────────────────────────

    pub fn get_election(env: Env, eid: u64) -> Option<ElectionParams> {
        env.storage().persistent().get(&DataKey::Election(eid))
    }

    pub fn get_ballot_count(env: Env, eid: u64) -> u32 {
        env.storage().persistent().get(&DataKey::BallotCount(eid)).unwrap_or(0)
    }

    pub fn get_ballot(env: Env, eid: u64, index: u32) -> Option<EncryptedBallot> {
        env.storage().persistent().get(&DataKey::Ballot(eid, index))
    }

    pub fn get_share_count(env: Env, eid: u64) -> u32 {
        env.storage().persistent().get(&DataKey::ShareCount(eid)).unwrap_or(0)
    }

    pub fn get_kh_shares(env: Env, eid: u64, kh_idx: u32) -> Option<Bytes> {
        env.storage().persistent().get(&DataKey::KhShare(eid, kh_idx))
    }

    pub fn get_tally(env: Env, eid: u64) -> Option<Vec<u32>> {
        env.storage().persistent().get(&DataKey::Tally(eid))
    }

    pub fn get_next_election_id(env: Env) -> u64 {
        env.storage().persistent().get(&DataKey::NextElectionId).unwrap_or(0)
    }

    pub fn is_cast_nullifier_used(env: Env, eid: u64, nf: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::CastNullifier(eid, nf))
    }

    pub fn is_issue_nullifier_used(env: Env, eid: u64, nf: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::IssueNullifier(eid, nf))
    }

    pub fn get_eligibility_root(env: Env, eid: u64) -> Option<BytesN<32>> {
        env.storage().persistent().get(&DataKey::EligibleRoot(eid))
    }

    pub fn get_kh_roster(env: Env, eid: u64) -> Option<Vec<BytesN<32>>> {
        env.storage().persistent().get(&DataKey::KhRoster(eid))
    }

    pub fn get_kh_commitment(env: Env, eid: u64, kh_idx: u32) -> Option<Bytes> {
        env.storage().persistent().get(&DataKey::KhCommitment(eid, kh_idx))
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /// Upgrade the contract WASM in-place.
    /// (PoC: no auth — testnet only)
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    /// Delete an election and all its associated data.
    ///
    /// Only allowed when:
    ///   - the election exists
    ///   - voting window has closed (`now >= end_time`)
    ///   - the election has not been tallied
    ///
    /// Note: individual nullifier / casting-account ledger entries are not
    /// removed (they will expire naturally via Soroban TTL).
    pub fn delete_election(env: Env, eid: u64) -> Result<(), ContractError> {
        let params = load_election(&env, eid)?;

        let now = env.ledger().timestamp();
        if now < params.end_time {
            return Err(ContractError::OutsideVotingWindow);
        }
        if params.tallied {
            return Err(ContractError::AlreadyTallied);
        }

        // Ballots
        let ballot_count: u32 = env
            .storage().persistent().get(&DataKey::BallotCount(eid)).unwrap_or(0);
        for i in 0..ballot_count {
            env.storage().persistent().remove(&DataKey::Ballot(eid, i));
        }
        env.storage().persistent().remove(&DataKey::BallotCount(eid));

        // KH shares and per-KH commitments
        let kh_roster: Vec<BytesN<32>> = env
            .storage().persistent().get(&DataKey::KhRoster(eid)).unwrap();
        for i in 0..kh_roster.len() {
            env.storage().persistent().remove(&DataKey::KhCommitment(eid, i));
            env.storage().persistent().remove(&DataKey::KhShare(eid, i));
        }
        env.storage().persistent().remove(&DataKey::ShareCount(eid));

        // Election metadata
        env.storage().persistent().remove(&DataKey::EligibleRoot(eid));
        env.storage().persistent().remove(&DataKey::DistRoster(eid));
        env.storage().persistent().remove(&DataKey::DistThreshold(eid));
        env.storage().persistent().remove(&DataKey::KhRoster(eid));
        env.storage().persistent().remove(&DataKey::KhThreshold(eid));
        env.storage().persistent().remove(&DataKey::Election(eid));

        env.events().publish((symbol_short!("deleted"), eid), ());

        Ok(())
    }
}
