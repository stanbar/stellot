import React, { useEffect } from 'react';
import { Form, notification, Radio } from 'antd';
import { dispatchFetchVoting, dispatchPerformVote, FETCH_VOTING, VOTING, VotingStateType } from "@/models/voting";
import { ConnectProps, Loading } from "@/models/connect";
import { connect } from 'dva';
import { Voting, Authorization } from "@stellot/types";
import { VoteStatus } from '@/types/voteStatus';
import { BtnLink, BtnSubmit } from "@/components/ActionButton";
import CastVoteModal from "@/components/CastVoteModal";
import VotingMetadata from "@/components/VotingMetadata";
import { Link } from "umi";
import { KeybaseAuthorizationView, EmailsAuthorizationView } from '@/components/AuthorizationView';
import * as storage from '@/storage'


interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  authToken?: string;
  status?: VoteStatus;
  loading?: boolean;
}

const VotePreview: React.FC<VotePreviewProps> = ({ loading, authToken, match, dispatch, voting }) => {
  const [form] = Form.useForm();
  const votingSlug = match?.params['id']!; // We can safely use ! because, undefined id is handled by vote/index

  useEffect(() => dispatchFetchVoting(dispatch, votingSlug), [votingSlug]);

  const radioStyle = {
    display: 'block',
    height: '50px',
    lineHeight: '50px',
    minWidth: '150px',
  };

  const onFinish = (values: any) => {
    const { optionCode } = values;
    if (!voting) {
      notification.error({
        message: 'Voting not found',
      });
    } else {
      dispatchPerformVote(dispatch, voting, optionCode, authToken)
    }
  };

  if (loading) {
    return (<p>Loading...</p>)
  }
  if (!voting) {
    return (<p>Failed to load voting</p>)
  }

  const txHash = storage.getMyTransaction(voting.id)

  if (voting.authorization === Authorization.KEYBASE && !authToken) {
    return (<KeybaseAuthorizationView dispatch={dispatch} voting={voting}/>)
  }
  if (voting.authorization === Authorization.EMAILS && !authToken) {
    return (<EmailsAuthorizationView dispatch={dispatch} voting={voting}/>)
  }
  return (
    <div>
      <VotingMetadata voting={voting}/>
      <h4>{voting?.polls[0].question}</h4>
      <Form layout="vertical" name="vote_form" onFinish={onFinish} form={form}>
        <Form.Item name="optionCode" rules={[{
          required: true,
          message: 'Please select your option!'
        }]}>
          <Radio.Group buttonStyle="solid" size="large">
            {voting.polls[0].options?.map(option => (
              <Radio.Button style={radioStyle} key={option.code} value={option.code}>{option.name}</Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <BtnSubmit type="primary" size="large" disabled={!txHash} htmlType="submit">
            Submit
          </BtnSubmit>
        </Form.Item>
      </Form>
      <Link to={`/voting/${votingSlug}/results`}>
        <BtnLink>
          Show results
        </BtnLink>
      </Link>
      <CastVoteModal/>
    </div>
  );
};
export default connect(({ voting, loading }: { voting: VotingStateType, loading: Loading }) =>
  ({
    authToken: voting.authToken,
    voting: voting.voting,
    status: voting.status,
    loading: loading.effects[`${VOTING}/${FETCH_VOTING}`],
  }))(VotePreview);
