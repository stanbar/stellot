use soroban_sdk::{contracttype, Bytes, BytesN, Vec};

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Global counter; value = next eid to assign
    NextElectionId,
    /// Core election parameters
    Election(u64),
    /// Per-KH constant-term commitment A_j0 (33-byte compressed secp256k1)
    /// Key: (eid, kh_index as u32)
    KhCommitment(u64, u32),
    /// Merkle root of the eligible-voter set
    EligibleRoot(u64),
    /// Distributor committee Ed25519 public keys (32-byte each)
    DistRoster(u64),
    /// Distributor threshold (M-of-N)
    DistThreshold(u64),
    /// Key-holder Ed25519 public keys (32-byte each)
    KhRoster(u64),
    /// Key-holder threshold (t-of-m)
    KhThreshold(u64),
    /// Issue nullifiers consumed
    IssueNullifier(u64, BytesN<32>),
    /// Casting accounts (32-byte Ed25519 pubkey) that have been registered
    CastingAccount(u64, BytesN<32>),
    /// Cast nullifiers consumed
    CastNullifier(u64, BytesN<32>),
    /// Number of ballots stored
    BallotCount(u64),
    /// Ballot at index i
    Ballot(u64, u32),
    /// Number of KH share-batches posted
    ShareCount(u64),
    /// Serialised decryption shares posted by KH j (index in roster)
    KhShare(u64, u32),
    /// Final tally (one u32 per option)
    Tally(u64),
}

// ── Core structs ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ElectionParams {
    pub eid: u64,
    pub title: Bytes,
    pub options_count: u32,
    pub start_time: u64,
    pub end_time: u64,
    /// Combined KH public key (33-byte compressed secp256k1)
    pub enc_pubkey: Bytes,
    pub tallied: bool,
}

/// A single encrypted ballot: (C1, C2) are 33-byte compressed secp256k1 points.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncryptedBallot {
    pub nf_cast: BytesN<32>,
    pub c1: Bytes,
    pub c2: Bytes,
}
