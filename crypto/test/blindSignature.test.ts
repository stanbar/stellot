import test from 'ava'

import { rand, eddsa } from 'elliptic'
import SignerSession from '../src/blindSignature/SignerSession'
import VoterSession from '../src/blindSignature/VoterSession'

const ed25519: eddsa = new eddsa('ed25519');

test('can blind sign/verify messages', async (t) => {
    const secret = rand(32);
    t.is(secret.length, 32)
    var msg = Buffer.from('private message');
    var key: eddsa.KeyPair = ed25519.keyFromSecret(secret);

    const signer = new SignerSession(secret);
    const user = new VoterSession(
        ed25519.encodePoint(signer.publicKey()),
        ed25519.encodePoint(signer.publicNonce())
    );

    const e = user.challenge(msg);
    const s = signer.sign(e);
    const sign = user.signature(s);

    t.true(key.verify(msg, sign))
});