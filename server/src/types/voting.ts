import Option from './option';

export default interface Voting {
  id: string;
  title: string;
  issueAccountId: string;
  assetCode: string;
  description: string;
  options: Option[];
  distributionAccountId: string;
  ballotBoxAccountId: string;
  authorizationCode: 'public' | 'email' | 'code' | 'custom';
  visibility: 'public' | 'unlisted' | 'private';
}
