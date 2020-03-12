import React from 'react';
import { Form, Button, Radio, Input, Card, Col, Typography, Row, InputNumber, Switch } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons/lib";
import styles from './index.css'

export default () => {
  const [form] = Form.useForm();
  const onFinish = (values: any) => {
    const val = values as {
      question: string | undefined,
      options?: string[] | undefined,
      authentication: string,
      votes: number,
      preliminary: boolean,
      challenges: number,
    };
    console.log({ val })
  };
  return (
    <Col sm={{ span: 20, offset: 2 }} xl={{ span: 16, offset: 4 }}>
      <Card title="Create new vote">
        <Col sm={{ span: 20, offset: 2 }} xl={{ span: 16, offset: 4 }}>
          <Form layout="vertical" form={form} name="options_form" onFinish={onFinish}
                initialValues={{
                  votes: 100,
                  authentication: 'emails',
                  preliminary: false,
                  challenges: 100,
                }}>
            <Form.Item name="question" label="Question">
              <Input placeholder="What is your favorite color ?"/>
            </Form.Item>
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <div>
                  <Form.Item
                    label="Options"
                    required
                    key="first"
                  >
                    <Row>
                      <Col flex="10px" style={{ marginRight: 10 }}>
                        <Typography>1</Typography>
                      </Col>
                      <Col flex="auto">
                        <Form.Item
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
                  {fields.map((field, index) => (
                    <Form.Item
                      label=""
                      required={false}
                      key={field.key}
                    >
                      <Row>
                        <Col flex="10px" style={{ marginRight: 10 }}>
                          <Typography>{index + 2}</Typography>
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
            <Form.Item name="authentication" label="Authentication method">
              <Radio.Group>
                <Radio.Button value="emails">Email</Radio.Button>
                <Radio.Button value="codes">Codes</Radio.Button>
                <Radio.Button value="public">Public</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="Number of votes">
              <Form.Item name="votes" noStyle>
                <InputNumber min={2} max={100000000000}/>
              </Form.Item>
            </Form.Item>
            <Form.Item name="preliminary" label="Preliminary results" valuePropName="checked">
              <Switch/>
            </Form.Item>
            <Form.Item label="Security level (number of challenges)">
              <Form.Item name="challenges" noStyle>
                <InputNumber min={2} max={1000}/>
              </Form.Item>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Card>
    </Col>
  );
}
