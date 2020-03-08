import SignerSession from './SignerSession'
import VoterSession from './VoterSession'
import elliptic from "elliptic";

const EdDSA = elliptic.eddsa;
const ed25519 = new EdDSA('ed25519');

export { SignerSession, VoterSession, EdDSA, ed25519 }
