import React, { useEffect } from 'react';
import { Form, notification, Radio, Input } from 'antd';
import { dispatchFetchVoting, dispatchPerformVote, FETCH_VOTING, VOTING, VotingStateType } from "@/models/voting";
import { ConnectProps, Loading } from "@/models/connect";
import { connect } from 'dva';
import Voting, { Authorization } from "@/types/voting";
import { VoteStatus } from '@/types/voteStatus';
import { BtnSubmit } from "@/components/ActionButton";
import CastVoteModal from "@/components/CastVoteModal";
import VotingMetadata from "@/components/VotingMetadata";

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
  txHash?: string;
}

const VotePreview: React.FC<VotePreviewProps> = ({ loading, txHash, match, dispatch, voting }) => {
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
    const { authorizationToken, optionCode } = values;
    if (!voting) {
      notification.error({
        message: 'Voting not found',
      });
    } else {
      dispatchPerformVote(dispatch, authorizationToken, voting, optionCode)
    }
  };

  if (loading) {
    return (<p>Loading...</p>)
  }
  if (!voting) {
    return (<p>Failed to load voting</p>)
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
        {voting?.authorization !== Authorization.OPEN &&
        <Form.Item label="Authorization code" name="authorizationToken" rules={[{
          required: true,
          message: 'Please input your authorization code!'
        }]}>
          <Input style={{ maxWidth: 200 }}/>
        </Form.Item>
        }
        <Form.Item>
          <BtnSubmit disabled={txHash} htmlType="submit">
            Submit
          </BtnSubmit>
        </Form.Item>
      </Form>
      <CastVoteModal/>
    </div>
  );
};
export default connect(({ voting, loading }: { voting: VotingStateType, loading: Loading }) =>
  ({
    voting: voting.voting,
    status: voting.status,
    loading: loading.effects[`${VOTING}/${FETCH_VOTING}`],
    txHash: voting.txHash,
  }))(VotePreview);
