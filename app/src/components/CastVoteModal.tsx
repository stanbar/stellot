import { connect } from 'dva';
import { ConnectProps } from '@/models/connect';
import React from 'react';
import { Modal, Progress } from 'antd';
import { dispatchSetAuthToken, dispatchSetStatus, VotingStateType } from '@/models/voting';
import { VoteStatus } from '@/types/voteStatus';
import { history } from 'umi';
import { Voting } from '@stellot/types';
import * as storage from '@/storage';

interface CastVoteModalProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  errorMessage?: string;
}

function calculateProgressPercent(voteStatus: VoteStatus) {
  const totalNumberOfStates = 8; // TODO figure out how to prevent from hardcoding
  switch (voteStatus) {
    case VoteStatus.INITIALIZING:
      return Math.round((1 / totalNumberOfStates) * 100);
    case VoteStatus.CREATING_BLINDED_TOKEN:
      return Math.round((2 / totalNumberOfStates) * 100);
    case VoteStatus.PREPARING_VOTING_ACCOUNT:
      return Math.round((3 / totalNumberOfStates) * 100);
    case VoteStatus.PUBLISH_ACCOUNT_CREATION_TRANSACTION:
      return Math.round((4 / totalNumberOfStates) * 100);
    case VoteStatus.WAITING_RANDOM_PEROID:
      return Math.round((5 / totalNumberOfStates) * 100);
    case VoteStatus.CASTING_VOTE:
      return Math.round((6 / totalNumberOfStates) * 100);
    case VoteStatus.SAVING_CASTED_TRANSACTION:
      return Math.round((7 / totalNumberOfStates) * 100);
    case VoteStatus.DONE:
      return Math.round((8 / totalNumberOfStates) * 100);
    default:
    case VoteStatus.UNDEFINED:
      return 0;
  }
}

function calculateProgressStatus(status: VoteStatus) {
  switch (status) {
    case VoteStatus.ERROR:
      return 'exception';
    case VoteStatus.DONE:
      return 'success';
    case VoteStatus.UNDEFINED:
      return 'normal';
    default:
      return 'active';
  }
}

const CastVoteModal: React.FC<CastVoteModalProps> = (props) => {
  const { dispatch, voting, status, errorMessage } = props;
  const txHash = voting ? storage.getMyTransaction(voting.id)?.myTxHash : undefined;
  if (!voting || !status) {
    return <></>;
  }
  const shouldShowVoteModal = status !== VoteStatus.UNDEFINED && status !== undefined;
  const enableShowResultsBtn = status === VoteStatus.ERROR || status === VoteStatus.DONE;
  const showResults = () => {
    history.replace(`/voting/${voting.slug}/results`);
    dispatchSetStatus(dispatch, VoteStatus.UNDEFINED);
  };
  const signInAgain = () => {
    dispatchSetStatus(dispatch, VoteStatus.UNDEFINED);
    dispatchSetAuthToken(dispatch, voting.id, undefined);
  };
  return (
    <Modal
      visible={shouldShowVoteModal}
      closable={false}
      width={300}
      okText="Show results"
      onOk={showResults}
      onCancel={() => dispatchSetStatus(dispatch, VoteStatus.UNDEFINED)}
      okButtonProps={{ disabled: !enableShowResultsBtn }}
      cancelButtonProps={{ disabled: !enableShowResultsBtn }}
      bodyStyle={{ textAlign: 'center' }}
    >
      <Progress
        type="circle"
        percent={calculateProgressPercent(status)}
        status={calculateProgressStatus(status)}
      />
      {errorMessage && (
        <p>
          {errorMessage} <a onClick={signInAgain}>Sign in again</a>
        </p>
      )}
      <p>{status}</p>
      {txHash && status === VoteStatus.DONE && (
        <a
          href={`https://testnet.lumenscan.io/txns/${txHash}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          Show transaction in explorer
        </a>
      )}
    </Modal>
  );
};

export default connect(({ voting }: { voting: VotingStateType }) => ({
  voting: voting.voting,
  status: voting.status,
  errorMessage: voting.errorMessage,
}))(CastVoteModal);
