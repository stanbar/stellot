import Voting from "@/types/voting";
import { Reducer } from 'redux';
import { Effect, Dispatch } from "dva";
import { performSignedTransaction } from "@/services/voting";
import { castVote } from "@/services/stellar";
import { fetchVoting } from "@/services/tokenDistributionServer";
import { VoteStatus } from "@/types/voteStatus";

export const VOTING = 'voting';
export const FETCH_VOTING = 'fetchVoting';
const SET_STATUS = 'setStatus';
const SET_VOTING = 'setVoting';

export async function dispatchPerformVote(dispatch: Dispatch, tokenId: string, vote: Voting, optionCode: number) {
  try {
    for await (const [tx, update] of performSignedTransaction(tokenId, vote, optionCode)) {
      if (update) {
        dispatch({
          type: `${VOTING}/${SET_STATUS}`,
          payload: update,
        });
      } else if (tx) {
        dispatch({
          type: `${VOTING}/${SET_STATUS}`,
          payload: VoteStatus.CASTING_VOTE,
        });
        await castVote(tx);
        dispatch({
          type: `${VOTING}/${SET_STATUS}`,
          payload: VoteStatus.DONE,
        });
      }
    }
  } catch (e) {
    console.error(e);
    dispatch({
      type: `${VOTING}/${SET_STATUS}`,
      payload: VoteStatus.ERROR,
    });
  }
}

export function dispatchFetchVoting(dispatch: Dispatch, votingId: string) {
  dispatch({
    type: `${VOTING}/${FETCH_VOTING}`,
    votingId
  })
}

export interface VotingStateType {
  voting?: Voting
  status?: VoteStatus;
}

export interface VotingModelType {
  namespace: string;
  state: VotingStateType;
  effects: {
    [FETCH_VOTING]: Effect,
  }
  reducers: {
    [SET_STATUS]: Reducer,
    [SET_VOTING]: Reducer,
  }
}

export const VotingModel: VotingModelType = {
  namespace: VOTING,
  state: {
    voting: undefined,
    status: undefined,
  },
  effects: {
    * [FETCH_VOTING]({ votingId }, { call, put }) {
      const voting = yield call(fetchVoting, votingId);
      yield put({
        type: SET_VOTING,
        payload: voting
      })
    }
  },
  reducers: {
    [SET_STATUS](state: VotingStateType, { payload }): VotingStateType {
      return {
        ...state,
        status: payload,
      }
    },
    [SET_VOTING](state: VotingStateType, { payload }): VotingStateType {
      return {
        ...state,
        voting: payload,
      }
    }
  },
};

export default VotingModel;
