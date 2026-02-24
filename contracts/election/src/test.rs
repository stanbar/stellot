#![cfg(test)]

extern crate std;

use soroban_sdk::{
    testutils::{Ledger, LedgerInfo},
    Bytes, BytesN, Env, Vec,
};

use crate::{ElectionContract, ElectionContractClient};

// ── Signing helpers (std-only, uses ed25519-dalek) ────────────────────────────

fn bytes_to_vec(b: &Bytes) -> std::vec::Vec<u8> {
    (0..b.len()).map(|i| b.get(i).unwrap()).collect()
}

struct TestKey {
    signing: ed25519_dalek::SigningKey,
}

impl TestKey {
    /// Create a deterministic test key from a seed byte.
    fn from_seed(seed: u8) -> Self {
        let mut raw = [0u8; 32];
        raw[0] = seed;
        raw[31] = seed.wrapping_add(1);
        Self {
            signing: ed25519_dalek::SigningKey::from_bytes(&raw),
        }
    }

    fn pk_bytes_n(&self, env: &Env) -> BytesN<32> {
        BytesN::from_array(env, &self.signing.verifying_key().to_bytes())
    }

    fn sign_bytes(&self, env: &Env, msg: &Bytes) -> BytesN<64> {
        use ed25519_dalek::Signer;
        let raw = bytes_to_vec(msg);
        let sig = self.signing.sign(&raw);
        BytesN::from_array(env, &sig.to_bytes())
    }
}

// ── Fake data helpers ─────────────────────────────────────────────────────────

fn fake_point(env: &Env, seed: u8) -> Bytes {
    let mut arr = [0u8; 33];
    arr[0] = 0x02;
    arr[1] = seed;
    Bytes::from_slice(env, &arr)
}

fn fake_nf(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

// ── Message construction (mirrors contract logic) ─────────────────────────────

fn mk_issue_msg(env: &Env, eid: u64, pk_cast: &BytesN<32>, nf_issue: &BytesN<32>) -> Bytes {
    let mut data = Bytes::new(env);
    data.extend_from_slice(b"stellot:issue");
    data.extend_from_slice(&eid.to_le_bytes());
    data.append(&pk_cast.into());
    data.append(&nf_issue.into());
    env.crypto().sha256(&data).into()
}

fn mk_cast_msg(env: &Env, eid: u64, nf: &BytesN<32>, c1: &Bytes, c2: &Bytes) -> Bytes {
    let mut data = Bytes::new(env);
    data.extend_from_slice(b"stellot:cast");
    data.extend_from_slice(&eid.to_le_bytes());
    data.append(&nf.into());
    data.append(c1);
    data.append(c2);
    env.crypto().sha256(&data).into()
}

fn mk_shares_msg(env: &Env, eid: u64, blob: &Bytes) -> Bytes {
    let mut data = Bytes::new(env);
    data.extend_from_slice(b"stellot:shares");
    data.extend_from_slice(&eid.to_le_bytes());
    data.append(blob);
    env.crypto().sha256(&data).into()
}

// ── Ledger helpers ────────────────────────────────────────────────────────────

fn advance_time(env: &Env, delta: u64) {
    env.ledger().set(LedgerInfo {
        timestamp: env.ledger().timestamp() + delta,
        protocol_version: 22,
        sequence_number: env.ledger().sequence(),
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10,
        min_persistent_entry_ttl: 10,
        max_entry_ttl: 3110400,
    });
}

fn set_timestamp(env: &Env, ts: u64) {
    env.ledger().set(LedgerInfo {
        timestamp: ts,
        protocol_version: 22,
        sequence_number: env.ledger().sequence(),
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 10,
        min_persistent_entry_ttl: 10,
        max_entry_ttl: 3110400,
    });
}

// ── Scenario helpers ──────────────────────────────────────────────────────────

fn deploy_election(
    env: &Env,
    client: &ElectionContractClient,
    kh_keys: &[&TestKey],
    dist_keys: &[&TestKey],
    dist_threshold: u32,
    kh_threshold: u32,
    start_offset: u64,
    end_offset: u64,
) -> u64 {
    let now = env.ledger().timestamp();
    let title = Bytes::from_slice(env, b"Test Election");
    let enc_pubkey = fake_point(env, 0xAA);
    let eligibility_root = fake_nf(env, 0x42);

    let mut dist_roster: Vec<BytesN<32>> = Vec::new(env);
    for k in dist_keys {
        dist_roster.push_back(k.pk_bytes_n(env));
    }
    let mut kh_roster: Vec<BytesN<32>> = Vec::new(env);
    for k in kh_keys {
        kh_roster.push_back(k.pk_bytes_n(env));
    }

    let eid = client.deploy(
        &title,
        &2u32,
        &(now + start_offset),
        &(now + end_offset),
        &enc_pubkey,
        &eligibility_root,
        &dist_roster,
        &dist_threshold,
        &kh_roster,
        &kh_threshold,
    );

    for i in 0..kh_keys.len() {
        client.set_kh_commitment(&eid, &(i as u32), &fake_point(env, 0x10 + i as u8));
    }

    eid
}

fn issue_account(
    env: &Env,
    client: &ElectionContractClient,
    eid: u64,
    pk_cast: &BytesN<32>,
    nf_issue: &BytesN<32>,
    dist_keys: &[&TestKey],
) {
    let msg = mk_issue_msg(env, eid, pk_cast, nf_issue);
    let mut sigs: Vec<(BytesN<32>, BytesN<64>)> = Vec::new(env);
    for k in dist_keys {
        sigs.push_back((k.pk_bytes_n(env), k.sign_bytes(env, &msg)));
    }
    client.issue_account(&eid, pk_cast, nf_issue, &sigs);
}

fn cast_ballot(
    env: &Env,
    client: &ElectionContractClient,
    eid: u64,
    cast_key: &TestKey,
    nf_cast: &BytesN<32>,
    c1: &Bytes,
    c2: &Bytes,
) -> u32 {
    let msg = mk_cast_msg(env, eid, nf_cast, c1, c2);
    let sig = cast_key.sign_bytes(env, &msg);
    client.cast(&eid, nf_cast, c1, c2, &cast_key.pk_bytes_n(env), &sig)
}

fn post_kh_share(
    env: &Env,
    client: &ElectionContractClient,
    eid: u64,
    kh_key: &TestKey,
    kh_idx: u32,
    ballot_count: u32,
) {
    let mut shares: Vec<(Bytes, Bytes)> = Vec::new(env);
    for i in 0..ballot_count {
        shares.push_back((
            fake_point(env, i as u8 + 1),
            fake_point(env, i as u8 + 10),
        ));
    }
    let blob = crate::serialise_shares(env, &shares);
    let msg = mk_shares_msg(env, eid, &blob);
    let sig = kh_key.sign_bytes(env, &msg);
    client.post_share(&eid, &kh_idx, &shares, &kh_key.pk_bytes_n(env), &sig);
}

// ── Test 1: Full happy-path flow ──────────────────────────────────────────────

#[test]
fn test_full_flow() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let kh2 = TestKey::from_seed(2);
    let dist1 = TestKey::from_seed(3);
    let voter1 = TestKey::from_seed(4);
    let voter2 = TestKey::from_seed(5);

    // Deploy: start in 10s, end in 200s
    let eid = deploy_election(&env, &client, &[&kh1, &kh2], &[&dist1], 1, 2, 10, 200);
    assert_eq!(eid, 0u64);

    // Advance into voting window
    advance_time(&env, 15);

    let nf_issue1 = fake_nf(&env, 0x01);
    let nf_issue2 = fake_nf(&env, 0x02);
    issue_account(&env, &client, eid, &voter1.pk_bytes_n(&env), &nf_issue1, &[&dist1]);
    issue_account(&env, &client, eid, &voter2.pk_bytes_n(&env), &nf_issue2, &[&dist1]);

    let nf_cast1 = fake_nf(&env, 0x10);
    let nf_cast2 = fake_nf(&env, 0x20);
    let c1_a = fake_point(&env, 0x01);
    let c2_a = fake_point(&env, 0x02);
    let c1_b = fake_point(&env, 0x03);
    let c2_b = fake_point(&env, 0x04);

    let idx1 = cast_ballot(&env, &client, eid, &voter1, &nf_cast1, &c1_a, &c2_a);
    let idx2 = cast_ballot(&env, &client, eid, &voter2, &nf_cast2, &c1_b, &c2_b);
    assert_eq!(idx1, 0);
    assert_eq!(idx2, 1);
    assert_eq!(client.get_ballot_count(&eid), 2);

    // Advance past end_time
    advance_time(&env, 300);

    post_kh_share(&env, &client, eid, &kh1, 0, 2);
    post_kh_share(&env, &client, eid, &kh2, 1, 2);
    assert_eq!(client.get_share_count(&eid), 2);

    let mut tally: Vec<u32> = Vec::new(&env);
    tally.push_back(1u32);
    tally.push_back(1u32);
    client.finalize_tally(&eid, &tally);

    let stored = client.get_tally(&eid).unwrap();
    assert_eq!(stored.get(0).unwrap(), 1u32);
    assert_eq!(stored.get(1).unwrap(), 1u32);
    assert!(client.get_election(&eid).unwrap().tallied);
}

// ── Test 2: Duplicate cast rejected ──────────────────────────────────────────

#[test]
fn test_duplicate_cast_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let dist1 = TestKey::from_seed(3);
    let voter1 = TestKey::from_seed(4);

    let eid = deploy_election(&env, &client, &[&kh1], &[&dist1], 1, 1, 10, 200);
    advance_time(&env, 15);

    let nf_issue = fake_nf(&env, 0x01);
    issue_account(&env, &client, eid, &voter1.pk_bytes_n(&env), &nf_issue, &[&dist1]);

    let nf_cast = fake_nf(&env, 0x10);
    let c1 = fake_point(&env, 0x01);
    let c2 = fake_point(&env, 0x02);

    cast_ballot(&env, &client, eid, &voter1, &nf_cast, &c1, &c2);

    // Second cast with same nullifier → AlreadyVoted (#5)
    let msg = mk_cast_msg(&env, eid, &nf_cast, &c1, &c2);
    let sig = voter1.sign_bytes(&env, &msg);
    let result = client.try_cast(&eid, &nf_cast, &c1, &c2, &voter1.pk_bytes_n(&env), &sig);
    // Must fail (outer Result) since contract returns an error
    assert!(result.is_err() || result.unwrap().is_err(),
        "expected AlreadyVoted error");
}

// ── Test 3: Duplicate issue rejected ─────────────────────────────────────────

#[test]
fn test_duplicate_issue_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let dist1 = TestKey::from_seed(3);
    let voter1 = TestKey::from_seed(4);

    let eid = deploy_election(&env, &client, &[&kh1], &[&dist1], 1, 1, 10, 200);
    let nf_issue = fake_nf(&env, 0x01);

    issue_account(&env, &client, eid, &voter1.pk_bytes_n(&env), &nf_issue, &[&dist1]);

    // Second issue with same nullifier → AlreadyIssued (#4)
    let msg = mk_issue_msg(&env, eid, &voter1.pk_bytes_n(&env), &nf_issue);
    let mut sigs: Vec<(BytesN<32>, BytesN<64>)> = Vec::new(&env);
    sigs.push_back((dist1.pk_bytes_n(&env), dist1.sign_bytes(&env, &msg)));
    let result = client.try_issue_account(&eid, &voter1.pk_bytes_n(&env), &nf_issue, &sigs);
    assert!(result.is_err() || result.unwrap().is_err(),
        "expected AlreadyIssued error");
}

// ── Test 4: Cast outside voting window ───────────────────────────────────────

#[test]
fn test_cast_outside_window() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let dist1 = TestKey::from_seed(3);
    let voter1 = TestKey::from_seed(4);

    // start = now+100 = 1100, end = now+200 = 1200
    let eid = deploy_election(&env, &client, &[&kh1], &[&dist1], 1, 1, 100, 200);
    let nf_issue = fake_nf(&env, 0x01);
    issue_account(&env, &client, eid, &voter1.pk_bytes_n(&env), &nf_issue, &[&dist1]);

    let nf_cast = fake_nf(&env, 0x10);
    let c1 = fake_point(&env, 0x01);
    let c2 = fake_point(&env, 0x02);
    let msg = mk_cast_msg(&env, eid, &nf_cast, &c1, &c2);
    let sig = voter1.sign_bytes(&env, &msg);

    // Before start_time (timestamp=1000 < 1100) → OutsideVotingWindow
    let r1 = client.try_cast(&eid, &nf_cast, &c1, &c2, &voter1.pk_bytes_n(&env), &sig);
    assert!(r1.is_err() || r1.unwrap().is_err(), "expected error before window");

    // After end_time (timestamp=2000 > 1200) → OutsideVotingWindow
    set_timestamp(&env, 2000);
    let r2 = client.try_cast(&eid, &nf_cast, &c1, &c2, &voter1.pk_bytes_n(&env), &sig);
    assert!(r2.is_err() || r2.unwrap().is_err(), "expected error after window");
}

// ── Test 5: Unregistered caster ───────────────────────────────────────────────

#[test]
fn test_unregistered_caster() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let dist1 = TestKey::from_seed(3);
    let rogue = TestKey::from_seed(99);

    let eid = deploy_election(&env, &client, &[&kh1], &[&dist1], 1, 1, 10, 200);
    advance_time(&env, 15);

    let nf_cast = fake_nf(&env, 0x10);
    let c1 = fake_point(&env, 0x01);
    let c2 = fake_point(&env, 0x02);
    let msg = mk_cast_msg(&env, eid, &nf_cast, &c1, &c2);
    let sig = rogue.sign_bytes(&env, &msg);

    // rogue key was never issued → NotIssuedAccount (#6)
    let result = client.try_cast(&eid, &nf_cast, &c1, &c2, &rogue.pk_bytes_n(&env), &sig);
    assert!(result.is_err() || result.unwrap().is_err(),
        "expected NotIssuedAccount error");
}

// ── Test 6: Tally before threshold ───────────────────────────────────────────

#[test]
fn test_tally_before_threshold() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let kh2 = TestKey::from_seed(2);
    let dist1 = TestKey::from_seed(3);

    let eid = deploy_election(&env, &client, &[&kh1, &kh2], &[&dist1], 1, 2, 10, 120);
    advance_time(&env, 200);

    // Only 1-of-2 shares posted
    post_kh_share(&env, &client, eid, &kh1, 0, 0);

    let mut tally: Vec<u32> = Vec::new(&env);
    tally.push_back(0u32);
    tally.push_back(0u32);
    let result = client.try_finalize_tally(&eid, &tally);
    assert!(result.is_err() || result.unwrap().is_err(),
        "expected InsufficientShares error");
}

// ── Test 7: Tally wrong length ────────────────────────────────────────────────

#[test]
fn test_tally_wrong_length() {
    let env = Env::default();
    env.mock_all_auths();
    set_timestamp(&env, 1000);

    let contract_id = env.register(ElectionContract, ());
    let client = ElectionContractClient::new(&env, &contract_id);

    let kh1 = TestKey::from_seed(1);
    let dist1 = TestKey::from_seed(3);

    let eid = deploy_election(&env, &client, &[&kh1], &[&dist1], 1, 1, 10, 120);
    advance_time(&env, 200);

    post_kh_share(&env, &client, eid, &kh1, 0, 0);

    // options_count = 2 but we pass 3 entries → InvalidTally (#12)
    let mut tally: Vec<u32> = Vec::new(&env);
    tally.push_back(0u32);
    tally.push_back(0u32);
    tally.push_back(0u32);
    let result = client.try_finalize_tally(&eid, &tally);
    assert!(result.is_err() || result.unwrap().is_err(),
        "expected InvalidTally error");
}
