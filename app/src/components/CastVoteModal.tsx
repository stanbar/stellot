import { connect } from 'dva';
import { ConnectProps } from "@/models/connect";
import React from "react";
import { Modal, Progress } from 'antd';
import { dispatchSetStatus, VotingStateType } from "@/models/voting";
import { VoteStatus } from "@/types/voteStatus";
import router from "umi/router";
import Voting from "@/types/voting";

interface CastVoteModalProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  txHash?: string;
}


function calculateProgressPercent(voteStatus: VoteStatus) {
  const totalNumberOfStates = 7; // TODO figure out how to prevent from hardcoding
  switch (voteStatus) {
    case VoteStatus.INITIALIZING:
      return Math.round(1 / totalNumberOfStates * 100);
    case VoteStatus.CREATING_BLINDED_TRANSACTIONS:
      return Math.round(2 / totalNumberOfStates * 100);
    case VoteStatus.REQUESTED_CHALLENGE:
      return Math.round(3 / totalNumberOfStates * 100);
    case VoteStatus.PROOFING_CHALLENGE:
      return Math.round(4 / totalNumberOfStates * 100);
    case VoteStatus.CALCULATING_SIGNATURE:
      return Math.round(5 / totalNumberOfStates * 100);
    case VoteStatus.CASTING_VOTE:
      return Math.round(6 / totalNumberOfStates * 100);
    case VoteStatus.DONE:
      return Math.round(7 / totalNumberOfStates * 100);
    default:
    case VoteStatus.UNDEFINED:
      return 0;
  }
}

function calculateProgressStatus(status: VoteStatus) {
  switch (status) {
    case VoteStatus.ERROR:
      return "exception";
    case VoteStatus.DONE:
      return "success";
    case VoteStatus.UNDEFINED:
      return "normal";
    default:
      return "active";
  }
}

const CastVoteModal: React.FC<CastVoteModalProps> = props => {
  const { dispatch, voting, status, txHash } = props;
  if (!voting || !status) {
    return <></>
  }
  const shouldShowVoteModal = status !== VoteStatus.UNDEFINED && status !== undefined;
  const enableShowResultsBtn = status === VoteStatus.ERROR || status === VoteStatus.DONE;
  const showResults = () => {
    router.replace(`/voting/${voting.slug}/results`);
    dispatchSetStatus(dispatch, VoteStatus.UNDEFINED, undefined)
  };
  return (
    <Modal visible={shouldShowVoteModal}
           closable={false}
           width={300}
           okText="Show results"
           onOk={showResults}
           onCancel={() => dispatchSetStatus(dispatch, VoteStatus.UNDEFINED, undefined)}
           okButtonProps={{ disabled: !enableShowResultsBtn }}
           cancelButtonProps={{ disabled: !enableShowResultsBtn }}
           bodyStyle={{ textAlign: 'center' }}
    >
      <Progress type="circle"
                percent={calculateProgressPercent(status)}
                status={calculateProgressStatus(status)}/>
      <p>{status}</p>
      {txHash &&
      <a href={`http://testnet.stellarchain.io/tx/${txHash}`} target="_blank" rel="noreferrer noopener">Show transaction
        in explorer</a>}
    </Modal>
  )

};

export default connect(({ voting }: { voting: VotingStateType }) =>
  ({
    voting: voting.voting,
    status: voting.status,
    txHash: voting.txHash,
  }))(CastVoteModal);
