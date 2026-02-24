use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// Election already exists for this eid
    AlreadyExists = 1,
    /// Election not found
    NotFound = 2,
    /// Voting window has not opened yet or has already closed
    OutsideVotingWindow = 3,
    /// Issue nullifier already used
    AlreadyIssued = 4,
    /// Cast nullifier already used (double-vote attempt)
    AlreadyVoted = 5,
    /// Casting account is not registered (not issued)
    NotIssuedAccount = 6,
    /// Ed25519 signature verification failed
    InvalidSignature = 7,
    /// Merkle proof verification failed
    InvalidMerkleProof = 8,
    /// Caller is not in the KH roster
    NotKeyHolder = 9,
    /// Key holder has already posted their shares
    AlreadyPosted = 10,
    /// Not enough decryption shares have been posted yet
    InsufficientShares = 11,
    /// Tally length does not match options_count
    InvalidTally = 12,
    /// Election already tallied
    AlreadyTallied = 13,
    /// Invalid distributor multi-sig
    InvalidDistributorSig = 14,
    /// Distributor is not in the roster
    NotDistributor = 15,
    /// Arithmetic / encoding error
    EncodingError = 16,
}
