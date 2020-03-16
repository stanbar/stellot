import Voting, { Authorization, Visibility } from './types/voting';
import Option from './types/option';
import { Keypair } from 'stellar-sdk';

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

interface KeyChain {
  distribution: string,
  issuer: string,
  ballotBox: string
}

const secrets: { [votingId: string]: KeyChain } = {};

secrets.presidentElection2019 = {
  distribution: 'SBQ5HMAGX4CIQMIZ3IXOLQHLAEL5NLOWXMU4T2LTKMDLG4WU4IYDTHJN',
  issuer: 'SB3IU2OST7MSXTYYQNFZDLBI6ZLQQLOOZFEDQCQHBMALAEGEDGTTKK7B',
  ballotBox: 'SD4VV26KLMXJCP2VWJXW7VICHOU25HALCC66LGWINCCAZP266RHO7HT3',
};

export function setIssued(voting: Voting, userId: string) {
  issues[voting.id][userId] = true;
}

export function getVoting(votingId: string): Voting {
  return votings[votingId]
}

export function setVoting(voting: Voting) {
  votings[voting.id] = voting;
}

export function getAllPublicVotes(): Voting[] {
  return Object.values(votings).filter(voting => voting.visibility === 'public');
}

export function getKeychain(votingId: string): KeyChain {
  return secrets[votingId]
}

export function setKeychain(
  votingId: string,
  issuer: Keypair,
  distribution: Keypair,
  ballotBox: Keypair) {
  secrets[votingId] = {
    issuer: issuer.secret(), distribution: distribution.secret(), ballotBox: ballotBox.secret(),
  }
}
