import { Authorization, Visibility } from './voting';
import Poll from './poll';

export default interface CreateVotingRequest {
  title: string;
  polls: Poll[]
  authorization: Authorization;
  visibility: Visibility;
  votesCap: number;
  encrypted: boolean;
  challenges: number;
  startDate: Date;
  endDate: Date;
}
