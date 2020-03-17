import { Effect, Dispatch } from "dva";
import { createVoting } from '@/services/tokenDistributionServer';
import { Reducer } from "redux";
import Voting from "@/types/voting";
import CreateVotingRequest from "@/types/createVotingRequest";

const CREATE = 'create';
const CREATE_VOTING = 'createVoting';
const SET_CREATED_VOTING = 'setCreatedVoting';

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
  },
  reducers: {
    [SET_CREATED_VOTING]: Reducer,
  }
}

export const CreateModel: CreateModelType = {
  namespace: CREATE,
  state: {},
  effects: {
    * [CREATE_VOTING]({ createVotingRequest }, { call, put }) {
      const voting = yield call(createVoting, createVotingRequest);
      yield put({ type: SET_CREATED_VOTING, payload: voting })
    }
  },
  reducers: {
    [SET_CREATED_VOTING](state: CreateStateType, { payload }): CreateStateType {
      return {
        ...state,
        createdVoting: payload,
      }
    }
  }
};

export default CreateModel;
