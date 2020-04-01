import React from 'react';
import { Form, Button, Radio, Input, Col, Typography, Row, InputNumber, Switch, DatePicker } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons/lib";
import { CreateVotingRequest, Authorization, Visibility, KeybaseAuthOptions, EmailAuthOptions } from '@stellot/types';
import { isNotEmpty, capitalize } from '@/utils/utils';
import { CREATE, CREATE_VOTING, dispatchCreateVoting } from "@/models/create";
import { ConnectProps } from "@/models/connect";
import { connect } from 'dva';
import styles from './index.css'

interface CreateVotingProps extends ConnectProps {
  loading?: boolean
}

const CreateVoting: React.FC<CreateVotingProps> = ({ dispatch, loading }) => {
  const [form] = Form.useForm();
  const onFinish = (values: any) => {
    const val = values as {
      title: string,
      question: string,
      first: string,
      second: string,
      options?: string[] | undefined,
      authorization: Authorization,
      authorizationOptions: KeybaseAuthOptions | EmailAuthOptions | undefined,
      visibility: Visibility,
      votesCap: number,
      period: Array<Date>,
      encrypted: boolean,
      challenges: number,
    };

    console.log({ val });

    const createVoting: CreateVotingRequest = {
      title: val.title,
      polls: [{
        question: val.question,
        options: [val.first, val.second, ...(val.options || [])]
          .filter(isNotEmpty)
          .map((option, index) => ({ name: option, code: index + 1 })),
      }],
      authorization: val.authorization,
      authorizationOptions: val.authorizationOptions,
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
  return (
    <Form layout="vertical" form={form} name="options_form" onFinish={onFinish}
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
        <Input placeholder="Favourite colour"/>
      </Form.Item>

      <Form.Item name="question" label="Question" rules={[{
        required: true,
        whitespace: true,
        message: "Please input option value or delete this field.",
      }]}>
        <Input placeholder="What is your favourite colour ?"/>
      </Form.Item>
      <Form.Item
        label="Options"
      >
        <Row>
          <Col flex="10px" style={{ marginRight: 10 }}>
            <Typography>1</Typography>
          </Col>
          <Col flex="auto">
            <Form.Item
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
              <Input placeholder="Blue" style={{ marginRight: 32 }}/>
            </Form.Item>
          </Col>
          <Col flex="30px" style={{ marginRight: 10 }}/>
        </Row>
      </Form.Item>
      <Form.Item>
        <Row>
          <Col flex="10px" style={{ marginRight: 10 }}>
            <Typography>2</Typography>
          </Col>
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
              <Input placeholder="Red" style={{ marginRight: 32 }}/>
            </Form.Item>
          </Col>
          <Col flex="30px" style={{ marginRight: 10 }}/>
        </Row>
      </Form.Item>
      <Form.List name="options">
        {(fields, { add, remove }) => (
          <div>
            {fields.map((field, index) => (
              <Form.Item
                label=""
                required={false}
                key={field.key}
              >
                <Row>
                  <Col flex="10px" style={{ marginRight: 10 }}>
                    <Typography>{index + 3}</Typography>
                  </Col>
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
                      <Input placeholder="Option" style={{ marginRight: 32 }}/>
                    </Form.Item>
                  </Col>
                  <Col flex="30px" style={{ marginRight: 10 }}>
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
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => {
                  add();
                }}
              >
                <PlusOutlined/> Add an option
              </Button>
            </Form.Item>
          </div>
        )}
      </Form.List>
      <Form.Item name="authorization" label="Authorization method">
        <Radio.Group>
          <Radio.Button value={Authorization.OPEN}>{capitalize(Authorization.OPEN)}</Radio.Button>
          <Radio.Button disabled value={Authorization.EMAIL}>{capitalize(Authorization.EMAIL)}</Radio.Button>
          <Radio.Button disabled value={Authorization.CODE}>{capitalize(Authorization.CODE)}</Radio.Button>
          <Radio.Button value={Authorization.KEYBASE}>{capitalize(Authorization.KEYBASE)}</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => prevValues.authorization !== currentValues.authorization}
      >
        {({ getFieldValue }) => {
          console.log(getFieldValue('authorization'));

          return getFieldValue('authorization') === Authorization.KEYBASE ? (
            <div>
              <Form.Item name={['authorizationOptions', 'team']}
                         label="(Optional) Team membership"
                         rules={[{
                           whitespace: true,
                           message: "Please input option value or delete this field.",
                         }]}
              >
                <Input placeholder="stellar.public"/>
              </Form.Item>
              <Form.Item name={['authorizationOptions', 'channel']}
                         label="(Optional) Channel membership"
                         rules={[{
                           whitespace: true,
                           message: "Please input option value or delete this field.",
                         }]}
              >
                <Input placeholder="dev-discussions"/>
              </Form.Item>
            </div>
          ) : null
        }
        }
      </Form.Item>

      <Form.Item name="visibility" label="Listing visibility">
        <Radio.Group>
          <Radio.Button value={Visibility.PUBLIC}>{capitalize(Visibility.PUBLIC)}</Radio.Button>
          <Radio.Button value={Visibility.UNLISTED}>{capitalize(Visibility.UNLISTED)}</Radio.Button>
          <Radio.Button value={Visibility.PRIVATE}>{capitalize(Visibility.PRIVATE)}</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Number of votes cap">
        <Form.Item name="votesCap" noStyle>
          <InputNumber min={2}/>
        </Form.Item>
      </Form.Item>
      <Form.Item name="period" label="Select time period"
                 rules={[{ type: 'array', required: true, message: 'Please select time!' }]}>
        <DatePicker.RangePicker/>
      </Form.Item>
      <Form.Item name="encrypted" label="Encrypt results until the end of voting" valuePropName="checked">
        <Switch/>
      </Form.Item>
      <Form.Item label="Security level (number of challenges)">
        <Form.Item name="challenges" noStyle>
          <InputNumber min={2} max={100}/>
        </Form.Item>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {loading ? "Creating..." : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );
};
export default connect(({ loading }: { loading: any }) =>
  ({ loading: loading.effects[`${CREATE}/${CREATE_VOTING}`] }))(CreateVoting)
