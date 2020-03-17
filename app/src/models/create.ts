import { Effect, Dispatch } from "dva";
import { createVoting } from '@/services/tokenDistributionServer';
import Voting from "@/types/voting";
import CreateVotingRequest from "@/types/createVotingRequest";
import router from 'umi/router';

const CREATE = 'create';
const CREATE_VOTING = 'createVoting';

export function dispatchCreateVoting(dispatch: Dispatch, createVotingRequest: CreateVotingRequest) {
  dispatch({
    type: `${CREATE}/${CREATE_VOTING}`,
    createVotingRequest,
  })
}

export interface CreateStateType {
  createdVoting?: Voting;
}

export interface CreateModelType {
  namespace: string;
  state: CreateStateType;
  effects: {
    [CREATE_VOTING]: Effect
  }
}

export const CreateModel: CreateModelType = {
  namespace: CREATE,
  state: {},
  effects: {
    * [CREATE_VOTING]({ createVotingRequest }, { call }) {
      const voting = yield call(createVoting, createVotingRequest);
      router.replace(`/voting/${voting.id}`);
    }
  },
};

export default CreateModel;
