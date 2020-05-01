import React, { useState } from 'react';
import { Button, Col, Form, Input } from 'antd';
import * as keybase from '@/services/keybase';
import * as emails from '@/services/emails';
import { Dispatch } from 'dva';
import { dispatchSetAuthToken } from "@/models/voting";
import styles from "@/layouts/index.css";
import { Voting, Authorization } from '@stellot/types';
import KeybaseAuthOptions from "@stellot/types/lib/keybaseAuth";
import { MailOutlined } from '@ant-design/icons';

interface AuthorizationViewProps {
  dispatch: Dispatch;
  voting: Voting;
  authName: string;
  description: React.ReactNode;
  logo: React.ReactNode | string;
  inputPlaceholder: string;
}

export const KeybaseAuthorizationView = ({ dispatch, voting }: Pick<AuthorizationViewProps, "dispatch" | "voting">) =>
  <AuthorizationView
    dispatch={dispatch}
    voting={voting}
    authName="Keybase"
    description={<span>We will send you message via <a href="https://keybase.io/stellotbot">stellotbot</a> with authentication token.</span>}
    logo="https://keybase.io/images/icons/icon-keybase-logo-48@2x.png"
    inputPlaceholder="Please enter your keybase username"
  />
export const EmailsAuthorizationView = ({ dispatch, voting }: Pick<AuthorizationViewProps, "dispatch" | "voting">) =>
  <AuthorizationView
    dispatch={dispatch}
    voting={voting}
    authName="email"
    description={<span>We will send you email with authentication token.</span>}
    logo={<MailOutlined/>}
    inputPlaceholder="Please enter your email address"
  />
const AuthorizationView = ({ dispatch, voting, authName, description, logo, inputPlaceholder, }: AuthorizationViewProps) => {
  const [usernameForm] = Form.useForm();
  const [authorizationTokenForm] = Form.useForm();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [processingRequest, setProcessingRequest] = useState(false);

  const handleUsername = async (values: any) => {
    const { username } = values;
    try {
      setProcessingRequest(true);
      switch (voting.authorization) {
        case Authorization.KEYBASE:
          await keybase.requestToken(username,
            (voting.authorizationOptions as KeybaseAuthOptions).team);
          break;
        case Authorization.EMAILS:
          await emails.requestToken(username);
          break;
        default:
          throw new Error('unsupported authorization method')
      }
      setShowTokenInput(true);
      setErrorMessage(undefined);
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message);
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleToken = async (values: any) => {
    if (values?.token) {
      dispatchSetAuthToken(dispatch, voting.id, values.token);
    }
  };

  return (
    <Col className={styles.content}
         style={{ marginTop: '2em' }}
         xs={{ span: 22, offset: 1 }}
         sm={{ span: 20, offset: 2 }}
         md={{ span: 16, offset: 4 }}
         xl={{ span: 14, offset: 5 }}>
      <h1>Voting requires {authName} authentication</h1>
      <p>{description}</p>
      <Form layout="horizontal"
            form={usernameForm}
            name="username_form"
            onFinish={handleUsername}
            style={{ maxWidth: 300, width: '100%' }}>
        <Form.Item name="username" required style={{ marginBottom: 0 }}>
          <Input placeholder={inputPlaceholder} style={{ borderRadius: 3 }}/>
        </Form.Item>
        <span style={{ color: 'red' }}>{errorMessage}</span>
        <Form.Item style={{ marginTop: 8 }}>
          <Button htmlType="submit" color="#33a0ff" loading={processingRequest}
                  style={{ width: '100%', textAlign: 'left', borderRadius: 3 }}>
            {typeof logo === 'string' ?
              <img width={20} height={20} alt="auth method logo" style={{ marginRight: 8, marginLeft: 2 }}
                   src={logo}/> : logo
            }
            Send token
          </Button>
        </Form.Item>
      </Form>
      {showTokenInput &&
      <Form layout="horizontal"
            form={authorizationTokenForm} name="token_form"
            onFinish={handleToken}
            style={{ marginTop: 24, maxWidth: 300, width: '100%' }}
      >
        <Form.Item required name="token" style={{ marginBottom: 8 }}>
          <Input placeholder="Please enter token send to you in the message" width={300} height={200}/>
        </Form.Item>
        <Form.Item noStyle>
          <Button htmlType="submit" color="#33a0ff"
                  style={{ width: '100%', textAlign: 'left', paddingLeft: 10, borderRadius: 3 }}>
            Submit
          </Button>
        </Form.Item>
      </Form>
      }
    </Col>
  );
};
