import { rand, eddsa, curve } from 'elliptic'
import SignerSession from '../blindSignature/SignerSession'
import VoterSession from '../blindSignature/VoterSession'
import BN from 'bn.js'

describe('EDDSA(\'ed25519\') blind signature', () => {
    const ed25519: eddsa = new eddsa('ed25519');

    it('can blind sign/verify messages', function () {
        const secret = rand(32);
        expect(secret.length).toEqual(32)
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

        expect(key.verify(msg, sign)).toBeTruthy();
    });
});