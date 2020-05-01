import mongoose, { Document } from 'mongoose';
import { Keypair } from 'stellar-sdk';
import { Authorization, Visibility, Voting } from '@stellot/types';
import { KEYBASE_AUTH_OPTIONS, EMAILS_AUTH_OPTIONS, KEYCHAIN, VOTING } from './models';
import Keychain from '../types/keychain'

const debug = require('debug')('dao');

const issues: { [votingId: string]: { [userId: string]: boolean } } = {};

export function setIssued(voting: Voting, userId: string) {
  issues[voting.id][userId] = true;
}

const VotingSchema = mongoose.model(VOTING);
const KeychainSchema = mongoose.model(KEYCHAIN);
const KeybaseAuthOptionsSchema = mongoose.model(KEYBASE_AUTH_OPTIONS);
const EmailsAuthOptionsSchema = mongoose.model(EMAILS_AUTH_OPTIONS);

export async function getVotingById(votingId: string): Promise<Voting | undefined> {
  const votingDoc = await VotingSchema.findById(votingId);
  if (!votingDoc) {
    return undefined;
  }
  return populateVoting(votingDoc);
}

export async function getVotingBySlug(votingSlug: string): Promise<Voting | undefined> {
  const votingDoc = await VotingSchema.findOne({ slug: votingSlug });
  if (!votingDoc) {
    return undefined;
  }
  return populateVoting(votingDoc);
}

export async function getPublicVotings(): Promise<Voting[]> {
  const votingDocs = await VotingSchema.find({ visibility: Visibility.PUBLIC });
  return Promise.all(votingDocs.map(votingDoc => populateVoting(votingDoc)));
}

export async function populateVoting(votingDoc: Document): Promise<Voting> {
  const voting = votingDoc.toJSON();
  const authorizationOptions = await getAuthorizationOptions(voting);
  return { ...voting, authorizationOptions };
}

async function getAuthorizationOptions(voting: Omit<Voting, 'authorizationOptions'>): Promise<object | null> {
  switch (voting.authorization) {
    case Authorization.KEYBASE:
      return (await KeybaseAuthOptionsSchema.findOne({ voting: voting.id }))?.toJSON();
    case Authorization.EMAILS:
      return (await EmailsAuthOptionsSchema.findOne({ voting: voting.id }))?.toJSON();
    default:
      return null;
  }
}

export function votingExists(votingId: string): Promise<boolean> {
  return VotingSchema.exists({ _id: votingId })
}

export async function setVoting(voting: Omit<Omit<Voting, 'id'>, 'slug'>): Promise<Voting> {
  debug('setVoting');
  const votingDoc = new VotingSchema({ ...voting, authorizationOptions: undefined });
  const saved = await votingDoc.save();

  if (voting.authorizationOptions) {
    if (voting.authorization === Authorization.KEYBASE) {
      const authKeybaseOptions =
        new KeybaseAuthOptionsSchema({ voting: saved.id, ...voting.authorizationOptions });
      await authKeybaseOptions.save();
    } else if (voting.authorization === Authorization.EMAILS) {
      const authKeybaseOptions =
        new EmailsAuthOptionsSchema({ voting: saved.id, ...voting.authorizationOptions });
      await authKeybaseOptions.save();
    }
  }
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
