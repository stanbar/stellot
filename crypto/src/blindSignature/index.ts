
import elliptic from 'elliptic';
import VoterSession from './VoterSession'
import SignerSession from './SignerSession'

const EdDSA = elliptic.eddsa;
const ed25519 = new EdDSA('ed25519');

export { VoterSession, SignerSession, EdDSA, ed25519 }