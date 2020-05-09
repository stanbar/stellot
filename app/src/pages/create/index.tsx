import React, { useState } from 'react';
import { Form, Button, Radio, Input, Col, Row, InputNumber, Switch, DatePicker, Upload, message } from 'antd';
import { DownOutlined, MinusCircleOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons/lib";
import {
  CreateVotingRequest,
  Authorization,
  Visibility,
  KeybaseAuthOptions,
  EmailsAuthOptions,
} from '@stellot/types';
import { isNotEmpty, capitalize, isEmail } from '@/utils/utils';
import { CREATE, CREATE_VOTING, dispatchCreateVoting } from "@/models/create";
import { ConnectProps } from "@/models/connect";
import { connect } from 'dva';
import { BtnSubmit } from '@/components/ActionButton';
import SuccessCreatedVotingModal from '@/components/SuccessCreatedVoting';
import { UploadFile } from 'antd/lib/upload/interface';
import _ from 'lodash';
import styles from './index.css'

interface CreateVotingProps extends ConnectProps {
  loading?: boolean
}

const CreateVoting: React.FC<CreateVotingProps> = ({ dispatch, loading }) => {
  const [form] = Form.useForm();
  const [emails, setEmails] = useState<string[]>();
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const getAuthorizationOptions = async (authorization: Authorization, val: any): Promise<any> => {
    switch (authorization) {
      case Authorization.KEYBASE:
        return val.authorizationOptions
      case Authorization.EMAILS:
        console.log(emails)
        return { emails: await val.authorizationOptions.emails }
      case Authorization.DOMAIN:
        return val.authorizationOptions
      default:
        return undefined;
    }
  }
  const onFinish = async (values: any) => {
    const val = values as {
      title: string,
      question: string,
      first: string,
      second: string,
      options?: string[] | undefined,
      authorization: Authorization,
      authorizationOptions: KeybaseAuthOptions | EmailsAuthOptions | undefined,
      visibility: Visibility,
      votesCap: number,
      period: Array<Date>,
      encrypted: boolean,
      challenges: number,
    };

    const authorizationOptions = await getAuthorizationOptions(val.authorization, val)
    const createVoting: CreateVotingRequest = {
      title: val.title,
      polls: [{
        question: val.question,
        options: [val.first, val.second, ...(val.options || [])]
          .filter(isNotEmpty)
          .map((option, index) => ({ name: option, code: index + 1 })),
      }],
      authorization: val.authorization,
      authorizationOptions,
      visibility: val.visibility,
      votesCap: val.votesCap,
      encrypted: val.encrypted,
      challenges: val.challenges,
      startDate: val.period[0],
      endDate: val.period[1],
    };
    console.log({ createVoting });
    dispatchCreateVoting(dispatch, createVoting);
  };
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };
  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      xs: { span: 24, offset: 0 },
      sm: { span: 16, offset: 8 },
    },
  };
  const normFile = async (e: any) => {
    if (e.file.status === 'done') {
      const newEmails = await getEmailsList(e.file)
      const [passed, failed] = _.partition(newEmails, isEmail)
      const uniqueEmails = _.uniq(passed)
      const failedMessage = `${passed.length !== uniqueEmails.length ? `${passed.length - uniqueEmails.length} were duplicated and ` : ''}${failed.length > 0 ? `following emails were malformed: ${failed.join(' ')}` : ''}`
      message.warn(failedMessage)
      setEmails(uniqueEmails)
      return uniqueEmails
    }
    return null
  };

  function getEmailsList(file: UploadFile) {
    return new Promise<string[]>((resolve, reject) => {
      if (!file.originFileObj) {
        return reject(new Error('Origin file object undefined'));
      }
      const reader = new FileReader();
      reader.readAsText(file.originFileObj);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(/[\n,]/).map(email => email.trim()));
        } else {
          reject(new Error('Can not process ArrayBuffer'));
        }
      };
      reader.onerror = error => reject(error);
      return reader;
    });
  }


  return (
    <>
      <Form layout="horizontal"
        {...formItemLayout}
        form={form}
        name="options_form"
        onFinish={onFinish}
        scrollToFirstError
        initialValues={{
          votesCap: 100,
          authorization: Authorization.OPEN,
          visibility: Visibility.PUBLIC,
          encrypted: false,
          challenges: 100,
        }}>
        <Form.Item name="title" label="Title" rules={[{
          required: true,
          whitespace: true,
          message: "Please input option value or delete this field.",
        }]}>
          <Input placeholder="Favourite colour" />
        </Form.Item>

        <Form.Item name="question" label="Question" rules={[{
          required: true,
          whitespace: true,
          message: "Please input option value or delete this field.",
        }]}>
          <Input placeholder="What is your favourite colour ?" />
        </Form.Item>
        <Form.Item
          label="Options"
        >
          <Row>
            <Col flex="10px" style={{ marginRight: 10, alignSelf: 'center' }}>1.</Col>
            <Col flex="auto">
              <Form.Item
                {...formItemLayout}
                name="first"
                key="first"
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Please input option value or delete this field.",
                  },
                ]}
                noStyle
              >
                <Input placeholder="Blue" style={{ marginRight: 32 }} />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
        <Form.Item {...formItemLayoutWithOutLabel}>
          <Row>
            <Col flex="10px" style={{ marginRight: 10, alignSelf: 'center' }}>2.</Col>
            <Col flex="auto">
              <Form.Item
                name="second"
                key="second"
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "Please input option value or delete this field.",
                  },
                ]}
                noStyle
              >
                <Input placeholder="Red" style={{ marginRight: 32 }} />
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>
        <Form.List name="options">
          {(fields, { add, remove }) => (
            <div>
              {fields.map((field, index) => (
                <Form.Item
                  {...formItemLayoutWithOutLabel}
                  label=""
                  required={false}
                  key={field.key}
                >
                  <Row>
                    <Col flex="10px" style={{ marginRight: 10, alignSelf: 'center' }}>{index + 3}</Col>
                    <Col flex="auto">
                      <Form.Item
                        {...field}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: "Please input option value or delete this field.",
                          },
                        ]}
                        noStyle
                      >
                        <Input placeholder="Option" style={{ marginRight: 32 }} />
                      </Form.Item>
                    </Col>
                    <Col flex="30px" style={{ alignSelf: 'center', textAlign: 'center' }}>
                      <MinusCircleOutlined
                        className={styles.dynamicDeleteButton}
                        onClick={() => {
                          remove(field.name);
                        }}
                      />
                    </Col>

                  </Row>
                </Form.Item>
              ))}
              <Form.Item {...formItemLayoutWithOutLabel}>
                <Button
                  type="dashed"
                  onClick={() => {
                    add();
                  }}
                >
                  <PlusOutlined /> Add an option
              </Button>
              </Form.Item>
            </div>
          )}
        </Form.List>
        <Form.Item name="authorization" label="Authorization method">
          <Radio.Group>
            <Radio.Button value={Authorization.OPEN}>{capitalize(Authorization.OPEN)}</Radio.Button>
            <Radio.Button value={Authorization.COOKIE}>{capitalize(Authorization.COOKIE)}</Radio.Button>
            <Radio.Button value={Authorization.IP}>{Authorization.IP.toUpperCase()}</Radio.Button>
            <Radio.Button value={Authorization.EMAILS}>{capitalize(Authorization.EMAILS)}</Radio.Button>
            <Radio.Button value={Authorization.KEYBASE}>{capitalize(Authorization.KEYBASE)}</Radio.Button>
            <Radio.Button disabled value={Authorization.DOMAIN}>{capitalize(Authorization.DOMAIN)}</Radio.Button>
            <Radio.Button disabled value={Authorization.CODE}>{capitalize(Authorization.CODE)}</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.authorization !== currentValues.authorization}
        >
          {({ getFieldValue }) => ({
            [Authorization.KEYBASE]: (<Form.Item name={['authorizationOptions', 'team']}
              label="(Optional) Team membership"
              rules={[{
                whitespace: true,
                message: "Please input option value or delete this field.",
              }]}>
              <Input placeholder="stellar.public" />
            </Form.Item>),
            [Authorization.EMAILS]: (<Form.Item
              rules={[{
                required: true,
                message: "You need to upload the file with eligible email addresses",
              }]}
              name={['authorizationOptions', 'emails']}
              label="Emails"
              valuePropName="emails"
              getValueFromEvent={normFile}
              extra={emails ? `Uploaded file with ${emails.length} emails` : "Please upload file with eligible email addresses separated with new line or comma"}>
              <Upload multiple={false} name="logo" accept=".csv, text/plain" listType="text"
                customRequest={({ file, onSuccess }) => {
                  setTimeout(() => {
                    onSuccess({}, file);
                  }, 0)
                }}>
                <Button>
                  <UploadOutlined /> Click to upload
              </Button>
              </Upload>
            </Form.Item>),
            [Authorization.OPEN]: null,
          }[getFieldValue('authorization')])}
        </Form.Item>

        <Form.Item name="visibility" label="Listing visibility">
          <Radio.Group>
            <Radio.Button value={Visibility.PUBLIC}>{capitalize(Visibility.PUBLIC)}</Radio.Button>
            <Radio.Button value={Visibility.UNLISTED}>{capitalize(Visibility.UNLISTED)}</Radio.Button>
            <Radio.Button value={Visibility.PRIVATE}>{capitalize(Visibility.PRIVATE)}</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Number of votes cap"
          name="votesCap"
          rules={[{
            validator: (rule, value) => {
              if (emails && (value < emails.length))
                return Promise.reject(new Error('The value is less than total number of email addresses eligible to cast a vote'))
              return Promise.resolve()
            }
          }]}
          shouldUpdate={(prevValues, currentValues) => prevValues.votesCap !== currentValues.votesCap}
        >

          <InputNumber min={2} />
        </Form.Item>
        <Form.Item name="period" label="Select time period"
          rules={[{ type: 'array', required: true, message: 'Please select time!' }]}>
          <DatePicker.RangePicker />
        </Form.Item>
        {!showAdvanced &&
          <Form.Item {...formItemLayoutWithOutLabel}>

            <a
              style={{ fontSize: 12, }}
              onClick={() => {
                setShowAdvanced(true);
              }}
            >
              <DownOutlined /> Show advanced
        </a>
          </Form.Item>
        }
        <Form.Item
          name="encrypted" label="Encrypt partial results" valuePropName="checked"
          style={{ 'display': showAdvanced ? '' : 'none' }}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label="Security level"
          style={{ 'display': showAdvanced ? '' : 'none' }}>
          <Form.Item name="challenges" noStyle>
            <InputNumber min={2} max={500} />
          </Form.Item>
        </Form.Item>
        <Form.Item {...formItemLayoutWithOutLabel} >
          <BtnSubmit size="large" type="primary" htmlType="submit" loading={loading}>
            {loading ? "Creating..." : "Create"}
          </BtnSubmit>
        </Form.Item>
      </Form>
      <SuccessCreatedVotingModal />
    </>
  );
};
export default connect(({ loading }: { loading: any }) =>
  ({ loading: loading.effects[`${CREATE}/${CREATE_VOTING}`] }))(CreateVoting)
