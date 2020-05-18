import { Effect, Dispatch } from "dva";
import { Reducer } from 'redux';
import { createVoting } from '@/services/tds';
import { Voting, CreateVotingRequest } from "@stellot/types";

export const CREATE = 'create';
export const CREATE_VOTING = 'createVoting';
export const CANCEL_SUCCESS_CREATION = 'cancelSuccessCreation';
export const SHOW_SUCCESS_CREATION = 'showSuccessCreation';

export function dispatchCreateVoting(dispatch: Dispatch, createVotingRequest: CreateVotingRequest) {
  dispatch({
    type: `${CREATE}/${CREATE_VOTING}`,
    createVotingRequest,
  })
}

export function dispatchCancelSuccessCreationModel(dispatch: Dispatch) {
  dispatch({
    type: `${CREATE}/${CANCEL_SUCCESS_CREATION}`,
  })
}

export interface CreateStateType {
  showSuccessCreation?: boolean;
  voting?: Voting;
}

export interface CreateModelType {
  namespace: string;
  state: CreateStateType;
  effects: {
    [CREATE_VOTING]: Effect
  },
  reducers: {
    [SHOW_SUCCESS_CREATION]: Reducer,
    [CANCEL_SUCCESS_CREATION]: Reducer,
  }
}

export const CreateModel: CreateModelType = {
  namespace: CREATE,
  state: {},
  effects: {
    *[CREATE_VOTING]({ createVotingRequest }, { call, put }) {
      const voting = yield call(createVoting, createVotingRequest);
      console.log("voiing created", voting)
      yield put({ type: SHOW_SUCCESS_CREATION, voting })
    }
  },
  reducers: {
    [SHOW_SUCCESS_CREATION](state: CreateStateType, { voting }): CreateStateType {
      return {
        ...state,
        showSuccessCreation: true,
        voting,
      }
    },
    [CANCEL_SUCCESS_CREATION](state: CreateStateType): CreateStateType {
      return {
        ...state,
        showSuccessCreation: false,
        voting: undefined,
      }
    }
  },
};

export default CreateModel;
