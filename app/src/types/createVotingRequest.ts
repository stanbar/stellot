import { Authorization, Visibility } from "@/types/voting";
import Poll from "@/types/poll";

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
