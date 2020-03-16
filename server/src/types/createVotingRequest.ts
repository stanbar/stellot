import Option from './option';
import { Authorization, Visibility } from './voting';

export default interface CreateVotingRequest {
  title: string;
  description: string;
  options: Option[];
  authorization: Authorization;
  visibility: Visibility;
  votesCap: number;
  encrypted: boolean;
  challenges: number;
  startDate: Date;
  endDate: Date;
}
