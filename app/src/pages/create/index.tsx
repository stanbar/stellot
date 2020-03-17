import React from 'react';
import { Form, Button, Radio, Input, Col, Typography, Row, InputNumber, Switch } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons/lib";
import CreateVotingRequest from '@/types/createVotingRequest';
import { Authorization, Visibility } from "@/types/voting";
import { isNotEmpty } from '@/utils/utils';
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
      description: string,
      options?: string[] | undefined,
      authorization: Authorization,
      visibility: Visibility,
      votesCap: number,
      encrypted: boolean,
      challenges: number,
    };
    console.log({ val });

    const createVoting: CreateVotingRequest = {
      title: val.title,
      description: val.description,
      options: val.options!.filter(isNotEmpty).map((option, index) => ({ name: option, code: index + 1 })),
      authorization: val.authorization,
      visibility: val.visibility,
      votesCap: val.votesCap,
      encrypted: val.encrypted,
      challenges: val.challenges,
    };
    console.log({ createVoting });
    dispatchCreateVoting(dispatch, createVoting);
  };
  return (
    <Form layout="vertical" form={form} name="options_form" onFinish={onFinish}
          initialValues={{
            votesCap: 100,
            authorization: 'public',
            visibility: 'public',
            encrypted: false,
            challenges: 100,
          }}>
      <Form.Item name="title" label="Title" rules={[{ required: true }]}>
        <Input placeholder="Favorite color"/>
      </Form.Item>

      <Form.Item name="description" label="Description" rules={[{ required: true }]}>
        <Input placeholder="What is your favorite color ?"/>
      </Form.Item>

      <Form.List name="options">
        {(fields, { add, remove }) => (
          <div>
            {fields.map((field, index) => (
              <Form.Item
                label={index === 0 ? "Options" : ""}
                required={index === 0}
                key={field.key}
              >
                <Row>
                  <Col flex="10px" style={{ marginRight: 10 }}>
                    <Typography>{index + 1}</Typography>
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
          <Radio.Button value={Authorization.PUBLIC}>Public</Radio.Button>
          <Radio.Button value={Authorization.EMAIL}>Emails</Radio.Button>
          <Radio.Button value={Authorization.CODE}>Codes</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item name="visibility" label="Voting visibility">
        <Radio.Group>
          <Radio.Button value={Visibility.PUBLIC}>Public</Radio.Button>
          <Radio.Button value={Visibility.UNLISTED}>Unlisted</Radio.Button>
          <Radio.Button value={Visibility.PRIVATE}>Private</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Number of votes cap">
        <Form.Item name="votesCap" noStyle>
          <InputNumber min={2}/>
        </Form.Item>
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
          Create
        </Button>
      </Form.Item>
    </Form>
  );
}
export default connect(({ loading }: { loading: any }) =>
  ({ loading: loading.effects[`${CREATE}/${CREATE_VOTING}`] }))(CreateVoting)
