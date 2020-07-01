import { Voting, Authorization } from '@stellot/types';
import { Effect, Dispatch, Reducer } from 'umi';
import { performCastVoteTransaction } from '@/services/voting';
import { fetchResults } from '@/services/stellar';
import { fetchVoting } from '@/services/tds';
import { VoteStatus } from '@/types/voteStatus';
import Result from '@/types/result';
import * as storage from '@/storage';

export const VOTING = 'voting';
export const FETCH_VOTING = 'fetchVoting';
export const FETCH_RESULTS = 'fetchResults';
const SET_STATUS = 'setStatus';
const SET_VOTING = 'setVoting';
const SET_RESULTS = 'setResults';
const SET_AUTH_TOKEN = 'setAuthToken';

export async function dispatchPerformVote(
  dispatch: Dispatch,
  voting: Voting,
  optionCode: number,
  authToken?: string,
) {
  try {
    if (voting.authorization === Authorization.COOKIE && storage.didAlreadyVotedIn(voting.id)) {
      throw new Error('You have already voted in this ballot');
    }
    for await (const update of performCastVoteTransaction(voting, optionCode, authToken)) {
      dispatch({
        type: `${VOTING}/${SET_STATUS}`,
        payload: update,
      });
    }
  } catch (e) {
    console.error(e);
    const errorCode = e?.response?.data?.extras?.result_codes?.transaction;
    if (errorCode === 'tx_bad_seq') {
      // Interrupted between another session, retry
      await dispatchPerformVote(dispatch, voting, optionCode, authToken);
    }
    if (errorCode === 'tx_failed') {
      const operationError = e?.response?.data?.extras?.result_codes?.operations[0];
      if (operationError === 'op_line_full') {
        dispatch({
          type: `${VOTING}/${SET_STATUS}`,
          payload: VoteStatus.ERROR,
          errorMessage:
            'No more vote tokens can be issued, if you believe you are eligible to vote, please contact the organizers',
        });
      } else {
        dispatch({
          type: `${VOTING}/${SET_STATUS}`,
          payload: VoteStatus.ERROR,
          errorMessage: e?.response?.data?.extras?.result_codes?.operations?.join(','),
        });
      }
    } else {
      dispatch({
        type: `${VOTING}/${SET_STATUS}`,
        payload: VoteStatus.ERROR,
        errorMessage: e.message,
      });
    }
  }
}

export function dispatchSetStatus(dispatch: Dispatch, status: VoteStatus) {
  dispatch({
    type: `${VOTING}/${SET_STATUS}`,
    payload: status,
    errorMessage: undefined,
  });
}

export function dispatchSetAuthToken(dispatch: Dispatch, votingId: string, authToken?: string) {
  storage.setAuthenticationToken(votingId, authToken);
  dispatch({
    type: `${VOTING}/${SET_AUTH_TOKEN}`,
    payload: authToken,
  });
}

export function dispatchFetchVoting(dispatch: Dispatch, votingSlug: string) {
  dispatch({
    type: `${VOTING}/${FETCH_VOTING}`,
    votingSlug,
  });
}

export function dispatchFetchResults(dispatch: Dispatch, voting: Voting) {
  dispatch({
    type: `${VOTING}/${FETCH_RESULTS}`,
    voting,
  });
}

export interface VotingStateType {
  voting?: Voting;
  authToken?: string;
  status?: VoteStatus;
  results?: Result[];
  errorMessage?: string;
}

export interface VotingModelType {
  namespace: string;
  state: VotingStateType;
  effects: {
    [FETCH_VOTING]: Effect;
    [FETCH_RESULTS]: Effect;
  };
  reducers: {
    [SET_STATUS]: Reducer;
    [SET_VOTING]: Reducer;
    [SET_RESULTS]: Reducer;
    [SET_AUTH_TOKEN]: Reducer;
  };
}

export const VotingModel: VotingModelType = {
  namespace: VOTING,
  state: {},
  effects: {
    *[FETCH_VOTING]({ votingSlug }, { call, put }) {
      const voting = yield call(fetchVoting, votingSlug);
      const cachedToken = storage.getAuthenticationToken(voting.id);
      yield put({
        type: SET_VOTING,
        payload: voting,
        authToken: cachedToken,
      });
    },
    *[FETCH_RESULTS]({ voting }, { call, put }) {
      const results = yield call(fetchResults, voting);
      yield put({
        type: SET_RESULTS,
        payload: results,
      });
    },
  },
  reducers: {
    [SET_STATUS](state: VotingStateType, { payload, errorMessage }): VotingStateType {
      return {
        ...state,
        status: payload,
        errorMessage,
      };
    },
    [SET_VOTING](state: VotingStateType, { payload, authToken }): VotingStateType {
      return {
        ...state,
        voting: payload,
        authToken: authToken ?? state.authToken,
      };
    },
    [SET_AUTH_TOKEN](state: VotingStateType, { payload }): VotingStateType {
      return {
        ...state,
        authToken: payload,
      };
    },
    [SET_RESULTS](state: VotingStateType, { payload }): VotingStateType {
      return {
        ...state,
        results: payload,
      };
    },
  },
};

export default VotingModel;
