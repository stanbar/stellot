import Option from './option';

export enum Visibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private'
}

export enum Authorization {
  PUBLIC = 'public',
  EMAIL = 'email',
  CODE = 'code',
  CUSTOM = 'custom',
}

export default interface Voting {
  id: string;
  slug: string;
  title: string;
  description: string;
  assetCode: string;
  options: Option[];
  authorization: Authorization;
  visibility: Visibility;
  issueAccountId: string;
  distributionAccountId: string;
  ballotBoxAccountId: string;
  votesCap: number;
  encrypted: boolean,
  startDate: Date,
  endDate: Date,
}
