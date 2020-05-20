import { AnyAction } from 'redux';
import { Route, RouterTypes, Dispatch, IRouteComponentProps } from 'umi';

export interface Loading {
  effects: { [key: string]: boolean | undefined };
}

/**
 * @type T: Params matched in dynamic routing
 */
export interface ConnectProps<T = {}> extends IRouteComponentProps {
  dispatch: Dispatch<AnyAction>;
}
