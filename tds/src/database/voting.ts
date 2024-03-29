// @ts-nocheck
import { Document } from 'mongoose';
import { Authorization, Visibility, Voting } from '@stellot/types';
import { VotingModel } from './models';
import { getAuthorizationOptions } from './authorizationOptions';
import { getDecryptionKey } from './keychain';
import moment from 'moment';
import createHttpError from 'http-errors';

const issues: { [votingId: string]: { [userId: string]: boolean } } = {};

export function setIssued(voting: Voting, userId: string) {
  issues[voting.id][userId] = true;
}

export async function getVotingById(votingId: string): Promise<Voting | undefined> {
  const votingDoc = await VotingModel.findById(votingId);
  if (!votingDoc) {
    return undefined;
  }
  return populateDecryptionKey(await populateAuthorizationOptions(votingDoc));
}

export async function getVotingBySlug(votingSlug: string): Promise<Voting | undefined> {
  const votingDoc = await VotingModel.findOne({ slug: votingSlug });
  if (!votingDoc) {
    return undefined;
  }
  return populateDecryptionKey(await populateAuthorizationOptions(votingDoc));
}

export async function getPublicVotings(): Promise<Voting[]> {
  const votingDocs = await VotingModel.find({ visibility: Visibility.PUBLIC });
  return Promise.all(votingDocs.map(votingDoc => populateAuthorizationOptions(votingDoc)));
}

export async function populateAuthorizationOptions(votingDoc: Document): Promise<Voting> {
  const voting = votingDoc.toJSON();
  if (voting.authorization === Authorization.KEYBASE) {
    // Prevent emails/codes leakage
    const authorizationOptions = await getAuthorizationOptions(voting);
    return { ...voting, authorizationOptions };
  }
  return { ...voting };
}

export async function populateDecryptionKey(voting: Voting): Promise<Voting> {
  if (voting.encryption && moment(voting.encryption.encryptedUntil).isBefore()) {
    const decryptionKey = await getDecryptionKey(voting.id);
    return { ...voting, encryption: { ...voting.encryption, decryptionKey } };
  }
  return { ...voting };
}

export function votingExists(votingId: string): Promise<boolean> {
  return VotingModel.exists({ _id: votingId });
}

export async function saveVoting(
  voting: Omit<Omit<Omit<Omit<Voting, 'id'>, 'slug'>, 'authorizationOptions'>, 'ipfsCid'>,
): Promise<Omit<Omit<Voting, 'authorizationOptions'>, 'ipfsCid'>> {
  console.log('saveVoting');
  const votingDoc = new VotingModel({ ...voting });
  const saved = await votingDoc.save();
  return saved.toJSON();
}

export async function updateIpfsCid(
  voting: Omit<Voting, 'ipfsCid'>,
  ipfsCid: string,
): Promise<Voting> {
  console.log('updatingIpfsCid');
  const votingDoc = await VotingModel.findOne({ _id: voting.id });
  if (!votingDoc) {
    throw new Error(`Could not find requesting voting wih id ${voting.id}`);
  }
  // @ts-ignore
  votingDoc.ipfsCid = ipfsCid;
  const saved = await votingDoc.save();
  return saved.toJSON();
}

export async function deleteVotingBySlug(votingSlug: string) {
  const doc = await VotingModel.findOne({ slug: votingSlug });
  if (!doc) {
    throw new createHttpError.NotFound(`Could not find voting with slug: ${votingSlug}`);
  }
  const result = await doc.deleteOne();
  console.log(result);
}
