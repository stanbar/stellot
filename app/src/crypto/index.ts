import elliptic from 'elliptic';
import VoterSession from './VoterSession'

const EdDSA = elliptic.eddsa;
const ed25519 = new EdDSA('ed25519');

export { VoterSession, EdDSA, ed25519 }
