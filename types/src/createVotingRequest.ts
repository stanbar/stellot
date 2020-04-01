import { Authorization, Visibility } from './index';
import Poll from './poll';
import KeybaseAuthOptions from './keybaseAuth';
import EmailAuthOptions from "./emailAuth";

export default interface CreateVotingRequest {
  title: string;
  polls: Poll[]
  authorization: Authorization;
  authorizationOptions: KeybaseAuthOptions | EmailAuthOptions | undefined;
  visibility: Visibility;
  votesCap: number;
  encrypted: boolean;
  challenges: number;
  startDate: Date;
  endDate: Date;
}
