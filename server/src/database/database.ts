import mongoose from 'mongoose';
import { Keypair } from 'stellar-sdk';
import Voting, { Visibility } from '../types/voting';
import { KEYCHAIN, VOTING } from './models';
import Keychain from '../types/keychain'

const issues: { [votingId: string]: { [userId: string]: boolean } } = {};

export function setIssued(voting: Voting, userId: string) {
  issues[voting.id][userId] = true;
}

const VotingSchema = mongoose.model(VOTING);
const KeychainSchema = mongoose.model(KEYCHAIN);

export async function getPublicVotings(): Promise<Voting[]> {
  return (await VotingSchema.find({ visibility: Visibility.PUBLIC }))?.map(doc => doc.toJSON());
}

export function votingExists(votingId: string): Promise<boolean> {
  return VotingSchema.exists({ _id: votingId })
}

export async function getVotingById(votingId: string): Promise<Voting | undefined> {
  return (await VotingSchema.findById(votingId))?.toJSON();
}

export async function getVotingBySlug(votingSlug: string): Promise<Voting | undefined> {
  return (await VotingSchema.findOne({ slug: votingSlug }))?.toJSON();
}

export async function setVoting(voting: Omit<Voting, 'id'>): Promise<Voting> {
  const votingDoc = new VotingSchema({ ...voting });
  const saved = await votingDoc.save();
  return saved.toJSON();
}


export async function getKeychain(votingId: string): Promise<Keychain | null> {
  const keychain = await KeychainSchema.findOne({ voting: votingId });
  return keychain?.toJSON()
}

export async function setKeychain(
  votingId: string,
  issuer: Keypair,
  distribution: Keypair,
  ballotBox: Keypair) {
  const keychain = new KeychainSchema({
    voting: votingId,
    issuer: issuer.secret(),
    distribution: distribution.secret(),
    ballotBox: ballotBox.secret(),
  });
  await keychain.save()
}
