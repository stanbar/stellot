import { AnyAction } from 'redux';
import { Route, RouterTypes } from 'umi';
import { Dispatch } from "dva";

/**
 * @type T: Params matched in dynamic routing
 */
export interface ConnectProps<T = {}> extends Partial<RouterTypes<Route, T>> {
  dispatch: Dispatch<AnyAction>;
}
