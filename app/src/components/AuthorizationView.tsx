import React, { useState } from 'react';
import { Button, Col, Form, Input } from 'antd';
import * as keybase from '@/services/keybase';
import * as storage from '@/storage';
import { Dispatch } from 'dva';
import { dispatchSetAuthToken } from "@/models/voting";
import styles from "@/layouts/index.css";
import { Voting } from '@stellot/types';
import KeybaseAuthOptions from "@stellot/types/lib/keybaseAuth";

export default ({ dispatch, voting }: { dispatch: Dispatch, voting: Voting }) => {
  const [usernameForm] = Form.useForm();
  const [authorizationTokenForm] = Form.useForm();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [processingRequest, setProcessingRequest] = useState(false);

  const handleUsername = async (values: any) => {
    console.log({ values });
    const userName = values.username;
    try {
      setProcessingRequest(true);
      await keybase.requestToken(userName,
        (voting.authorizationOptions as KeybaseAuthOptions).team);
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
    storage.setKeybaseToken(values.token);
    if (values?.token) {
      dispatchSetAuthToken(dispatch, values.token);
    }
  };

  return (
    <Col className={styles.content}
         style={{ marginTop: '2em' }}
         xs={{ span: 22, offset: 1 }}
         sm={{ span: 20, offset: 2 }}
         md={{ span: 16, offset: 4 }}
         xl={{ span: 14, offset: 5 }}>
      <h1>Voting requires keybase authorization</h1>
      <Form layout="horizontal"
            form={usernameForm}
            name="username_form"
            onFinish={handleUsername}
            style={{ maxWidth: 300, width: '100%' }}>
        <Form.Item name="username" required style={{ marginBottom: 0 }}>
          <Input placeholder="Please enter your keybase username" style={{ borderRadius: 3 }}/>
        </Form.Item>
        <span style={{ color: 'red' }}>{errorMessage}</span>
        <Form.Item style={{ marginTop: 8 }}>
          <Button htmlType="submit" color="#33a0ff" loading={processingRequest}
                  style={{ width: '100%', textAlign: 'left', borderRadius: 3 }}>
            <img width={20} height={20} alt="keybase logo" style={{ marginRight: 8, marginLeft: 2 }}
                 src="https://keybase.io/images/icons/icon-keybase-logo-48@2x.png"/>
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
          <Input placeholder="Please enter token send to you in keybase message" width={300} height={200}/>
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
