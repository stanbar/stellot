/// SHA256 Merkle tree verification (no_std compatible).
///
/// Leaf hash:     SHA256(b"stellot:leaf" || leaf_bytes)
/// Internal hash: SHA256(b"stellot:node" || left_32 || right_32)
///
/// Domain separation prevents second-preimage attacks where an internal node
/// could be confused with a leaf.
use soroban_sdk::{Bytes, BytesN, Env, Vec};

const LEAF_PREFIX: &[u8] = b"stellot:leaf";
const NODE_PREFIX: &[u8] = b"stellot:node";

/// Compute the leaf hash for a voter public key (or any leaf value).
pub fn leaf_hash(env: &Env, leaf_bytes: &Bytes) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.extend_from_slice(LEAF_PREFIX);
    data.append(leaf_bytes);
    env.crypto().sha256(&data).into()
}

/// Compute an internal node hash from two 32-byte children.
pub fn node_hash(env: &Env, left: &BytesN<32>, right: &BytesN<32>) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.extend_from_slice(NODE_PREFIX);
    let left_bytes: Bytes = left.into();
    let right_bytes: Bytes = right.into();
    data.append(&left_bytes);
    data.append(&right_bytes);
    env.crypto().sha256(&data).into()
}

/// Verify a Merkle inclusion proof.
///
/// # Arguments
/// * `root`       — expected Merkle root (stored on-chain)
/// * `leaf_bytes` — raw bytes of the leaf value (e.g., voter pubkey)
/// * `proof`      — list of `(sibling_hash_32, is_right_sibling: bool)` pairs,
///                  bottom-up from the leaf towards the root.
///                  `is_right_sibling = true` means the sibling is to the RIGHT
///                  of the current node (so current node is LEFT child).
pub fn verify(
    env: &Env,
    root: &BytesN<32>,
    leaf_bytes: &Bytes,
    proof: &Vec<(BytesN<32>, bool)>,
) -> bool {
    let mut current = leaf_hash(env, leaf_bytes);

    for i in 0..proof.len() {
        let (sibling, is_right) = proof.get(i).unwrap();
        current = if is_right {
            // sibling is on the right  →  current is left child
            node_hash(env, &current, &sibling)
        } else {
            // sibling is on the left   →  current is right child
            node_hash(env, &sibling, &current)
        };
    }

    current == *root
}
