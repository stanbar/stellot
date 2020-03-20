import Option from "@/types/option";
import { Authorization, Visibility } from "@/types/voting";

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
