import React, { useEffect } from 'react';
import { Button, Form, Input, notification, Progress, Radio } from 'antd';
import stellotWhite from '@/assets/stellot_white.png'
import {
  EyeOutlined,
  KeyOutlined,
  LockOutlined,
  LinkOutlined,
  MailOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import { dispatchFetchVoting, dispatchPerformVote, VotingStateType } from "@/models/voting";
import { ConnectProps } from "@/models/connect";
import { connect } from 'dva';
import Voting, { Authorization, Visibility } from "@/types/voting";
import { VoteStatus } from '@/types/voteStatus';

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
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

const VotePreview: React.FC<VotePreviewProps> = (props: VotePreviewProps) => {
  const [form] = Form.useForm();
  const { match, dispatch, voting, status } = props;
  const votingId = match?.params['id']!; // We can safely use ! because, undefined id is handled by vote/index
  console.log({ votingId });

  useEffect(() => dispatchFetchVoting(dispatch, votingId), [votingId]);

  const radioStyle = {
    display: 'block',
    height: '50px',
    lineHeight: '50px',
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
  // TODO set rule to make option required
  return voting === undefined ? (<p>Loading...</p>) :
    (
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
          <Progress percent={calculateProgressPercent(status)} steps={7} strokeColor="#1890ff"/>
          <p>{status}</p>
        </div>
        }
      </div>
    );
};

export default connect(({ voting }: { voting: VotingStateType }) =>
  ({ voting: voting.voting, status: voting.status }))(VotePreview);
