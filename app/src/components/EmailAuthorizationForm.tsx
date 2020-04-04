import React from 'react';
import { Form, Input } from 'antd';

export default () => (
  <Form.Item label="Email address" name="authorizationToken" rules={[{
    required: true,
    message: 'Please input your email address!'
  }]}>
    <Input style={{ maxWidth: 200 }}/>
  </Form.Item>
);
