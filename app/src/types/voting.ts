import Option from "@/types/option";

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
  title: string;
  issueAccountId: string;
  assetCode: string;
  description: string;
  options: Option[];
  distributionAccountId: string;
  ballotBoxAccountId: string;
  authorization: Authorization;
  visibility: Visibility;
  votesCap: number;
}
