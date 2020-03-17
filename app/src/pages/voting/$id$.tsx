import React, { useEffect } from 'react';
import { Button, Form, Input, notification, Progress, Radio } from 'antd';
import stellotWhite from '@/assets/stellot_white.png'
import {
  EyeOutlined,
  KeyOutlined,
  LinkOutlined,
  LockOutlined,
  MailOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { dispatchFetchVoting, dispatchPerformVote, VotingStateType, VOTING, FETCH_VOTING } from "@/models/voting";
import { ConnectProps, Loading } from "@/models/connect";
import { connect } from 'dva';
import Voting, { Authorization, Visibility } from "@/types/voting";
import { VoteStatus } from '@/types/voteStatus';

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
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

const VotePreview: React.FC<VotePreviewProps> = ({ loading, match, dispatch, voting, status }) => {
  const [form] = Form.useForm();
  const votingId = match?.params['id']!; // We can safely use ! because, undefined id is handled by vote/index
  console.log({ votingId });

  useEffect(() => dispatchFetchVoting(dispatch, votingId), [votingId]);

  const radioStyle = {
    display: 'block',
    height: '50px',
    lineHeight: '50px',
    minWidth: '200px',
  };
  const onFinish = (values: any) => {
    console.log(values);
    const { authorizationToken, optionCode } = values;
    if (!voting) {
      notification.error({
        message: 'Voting not found',
      });
    } else {
      console.log({ authorizationToken, voting, optionCode });
      dispatchPerformVote(dispatch, authorizationToken, voting, optionCode)
    }
  };

  console.log({ voting });
  if (loading) {
    return (<p>Loading...</p>)
  }
  if (!voting) {
    return (<p>Failed to load voting</p>)
  }
  // TODO set rule to make option required
  return (
    <div>
      <p>
        {voting?.visibility === Visibility.PRIVATE && <LockOutlined/>}
        {voting?.visibility === Visibility.UNLISTED && <LinkOutlined/>}
        {voting?.visibility === Visibility.PUBLIC && <EyeOutlined/>}
        {voting?.authorization === Authorization.CODE && <KeyOutlined/>}
        {voting?.authorization === Authorization.CUSTOM && <KeyOutlined/>}
        {voting?.authorization === Authorization.EMAIL && <MailOutlined/>}
        {voting?.authorization === Authorization.PUBLIC && <NotificationOutlined/>}
        Vote {voting.id}
      </p>
      <h1>{voting?.title}</h1>
      <h4>{voting?.description}</h4>
      <Form layout="vertical" name="vote_form" onFinish={onFinish} form={form}>
        <Form.Item name="optionCode" rules={[{
          required: true,
          message: 'Please select your option!'
        }]}>
          <Radio.Group buttonStyle="solid" size="large">
            {voting.options?.map(option => (
              <Radio.Button style={radioStyle} key={option.code} value={option.code}>{option.name}</Radio.Button>
            ))}
          </Radio.Group>
        </Form.Item>
        {voting?.authorization !== "public" &&
        <Form.Item label="Authorization code" name="authorizationToken" rules={[{
          required: true,
          message: 'Please input your authorization code!'
        }]}>
          <Input style={{ maxWidth: 200 }}/>
        </Form.Item>
        }
        <Form.Item>
          <Button type="primary" size="large"
                  icon={<img alt="ballot" height={20} style={{ marginRight: 8, marginBottom: 4 }}
                             src={stellotWhite}/>}
                  htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
      {status && <div>
        <Progress percent={calculateProgressPercent(status)} steps={7} strokeColor="#1890ff"
                  status={calculateProgressStatus(status)}
        />
        <p>{status}</p>
      </div>
      }
    </div>
  );
};
export default connect(({ voting, loading }: { voting: VotingStateType, loading: Loading }) =>
  ({
    voting: voting.voting,
    status: voting.status,
    loading: loading.effects[`${VOTING}/${FETCH_VOTING}`]
  }))(VotePreview);
