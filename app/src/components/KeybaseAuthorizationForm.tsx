import React from 'react';
import { Form, Input } from 'antd';

export default () => (
  <Form.Item label="Keybase username" name="authorizationToken" rules={[{
    required: true,
    message: 'Please input your keybase username!'
  }]}>
    <Input style={{ maxWidth: 200 }}/>
  </Form.Item>
);
