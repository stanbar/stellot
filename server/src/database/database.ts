import mongoose from 'mongoose';
import { Keypair } from 'stellar-sdk';
import Voting, { Authorization, Visibility } from '../types/voting';
import Option from '../types/option';
import { KEYCHAIN, VOTING } from './models';
import Keychain from '../types/keychain'

const issues: { [votingId: string]: { [userId: string]: boolean } } = {};
const votings: { [votingId: string]: Voting } = {};

const CANDIDATES: Option[] = [
  {
    name: 'Andrzej Duda (PiS)',
    code: 1,
  },
  {
    name: 'Małgorzata Kidawa-Błońska (PO)',
    code: 2,
  },
  {
    name: 'Władysław Kosiniak-Kamysz (PSL)',
    code: 3,
  },
  {
    name: 'Robert Biedroń (LEWICA)',
    code: 4,
  },
  {
    name: 'Krzysztof Bosak (Konfederacja)',
    code: 5,
  },
];
votings.presidentElection2019 = {
  id: 'presidentElection2019',
  slug: 'presidentElection2019',
  title: '2020 Polish presidential election',
  description: 'Chose candidate',
  options: CANDIDATES,
  issueAccountId: 'GBCKKOTXWVHRHTWWSKN53HD3BMVXZCOFJAINKHL7YGGTXCFDVD7FMJSH',
  assetCode: 'Vote01122019',
  distributionAccountId: 'GA3WFG5ZB4CCEU6JOOTLQ5QPG73EX5E5MM5GZJEJ7CFLY7XZYSG73LEU',
  ballotBoxAccountId: 'GCIHXHZJNZYYQ6P63NMJWXGY6LDMSXRTBCKPNNOJLTE5NI4UBGWM4DAJ',
  votesCap: 100,
  authorization: Authorization.PUBLIC,
  visibility: Visibility.PUBLIC,
  encrypted: false,
  startDate: new Date(2020, 1),
  endDate: new Date(2020, 12),
};

const secrets: { [votingId: string]: Keychain } = {};

secrets.presidentElection2019 = {
  distribution: 'SBQ5HMAGX4CIQMIZ3IXOLQHLAEL5NLOWXMU4T2LTKMDLG4WU4IYDTHJN',
  issuer: 'SB3IU2OST7MSXTYYQNFZDLBI6ZLQQLOOZFEDQCQHBMALAEGEDGTTKK7B',
  ballotBox: 'SD4VV26KLMXJCP2VWJXW7VICHOU25HALCC66LGWINCCAZP266RHO7HT3',
};

export function setIssued(voting: Voting, userId: string) {
  issues[voting.id][userId] = true;
}

const VotingSchema = mongoose.model(VOTING);

export async function getPublicVotings(): Promise<Voting[]> {
  return (await VotingSchema.find({ visibility: Visibility.PUBLIC }))?.map(doc => doc.toJSON());
}

export function votingExists(votingId: string): Promise<boolean> {
  return VotingSchema.exists({ _id: votingId })
}

export async function getVoting(votingSlug: string): Promise<Voting | undefined> {
  return (await VotingSchema.findOne({ slug: votingSlug }))?.toJSON();
}

export async function setVoting(voting: Voting): Promise<Voting> {
  const votingDoc = new VotingSchema({ ...voting });
  const saved = await votingDoc.save();
  return saved.toJSON();
}

export function getAllPublicVotes(): Voting[] {
  return Object.values(votings).filter(voting => voting.visibility === 'public');
}

const KeychainSchema = mongoose.model(KEYCHAIN);

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
    issuer: issuer.secret(), distribution: distribution.secret(), ballotBox: ballotBox.secret(),
  });
  await keychain.save()
}
