import React from 'react';
import { Spin } from 'antd';

const LoadingPage = () => (
    <div style={{ textAlign: 'center', padding: '30 50', margin: '50 50' }}>
        <Spin />
    </div>
);
export default LoadingPage;