import { Authorization, Visibility } from './index';
import Poll from './poll';
import KeybaseAuthOptions from './keybaseAuth';
import EmailsAuthOptions from "./emailAuth";

export default interface CreateVotingRequest {
  title: string;
  polls: Poll[]
  authorization: Authorization;
  authorizationOptions: KeybaseAuthOptions | EmailsAuthOptions | undefined;
  visibility: Visibility;
  votesCap: number;
  encrypted: boolean;
  encryptedUntil?: Date; // ISO 8601, Date.toJSON()
  challenges: number;
  startDate: Date;
  endDate: Date;
}
