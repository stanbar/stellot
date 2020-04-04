import React from 'react';
import { Form, Input } from 'antd';

export default () => (
  <Form.Item label="Authorization code" name="authorizationToken" rules={[{
    required: true,
    message: 'Please input your authorization code!'
  }]}>
    <Input style={{ maxWidth: 200 }}/>
  </Form.Item>
);
