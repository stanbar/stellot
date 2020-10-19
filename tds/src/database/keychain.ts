import { Keypair } from 'stellar-sdk';
import mongoose from 'mongoose';
import Keychain from '../types/keychain'
import { KEYCHAIN } from './models';

const KeychainSchema = mongoose.model(KEYCHAIN);

export async function getKeychain(votingId: string): Promise<Keychain | null> {
  const keychain = await KeychainSchema.findOne({ voting: votingId });
  return keychain?.toJSON()
}

export async function getDecryptionKey(votingId: string): Promise<string | undefined> {
  const keychain = await KeychainSchema.findOne({ voting: votingId });
  return keychain?.toJSON()?.decryption
}

export async function saveKeychain(
  votingId: string,
  issuer: Keypair,
  distribution: Keypair,
  ballotBox: Keypair,
  decryption?: string) {
  const keychain = new KeychainSchema({
    voting: votingId,
    issuer: issuer.secret(),
    distribution: distribution.secret(),
    ballotBox: ballotBox.secret(),
    decryption,
  });
  await keychain.save()
}
