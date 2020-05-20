import { Voting } from "@stellot/types";
import { Effect, Dispatch, Reducer } from "umi";
import { fetchVotes } from '@/services/tds';

const WALL = 'wall';
const SET_VOTES = 'setVotes';
const FETCH_VOTES = 'fetchVotes';

export function dispatchFetchVotes(dispatch: Dispatch) {
  dispatch({
    type: `${WALL}/${FETCH_VOTES}`
  })
}

export interface WallStateType {
  votes: Voting[]
}

export interface WallModelType {
  namespace: string;
  state: WallStateType;
  effects: {
    [FETCH_VOTES]: Effect
  }
  reducers: {
    [SET_VOTES]: Reducer,
  }
}

export const WallModel: WallModelType = {
  namespace: WALL,
  state: {
    votes: []
  },
  effects: {
    * [FETCH_VOTES](_, { call, put }) {
      const fetchedVotes = yield call(fetchVotes);
      yield put({ type: SET_VOTES, payload: fetchedVotes })
    }
  },
  reducers: {
    [SET_VOTES](state: WallStateType, { payload }): WallStateType {
      return {
        ...state,
        votes: payload
      }
    }
  },
};

export default WallModel;
