import React from 'react';
import styles from './index.css';
import { formatMessage } from 'umi-plugin-locale';
import { Typography, Button } from 'antd';
export default function() {
  return (
    <div className={styles.normal}>
      <ul className={styles.list}>
        <Typography.Title>Welcome in Stellot - Voting platform build with ❤️ to Stellar</Typography.Title>
        <li><Button type="primary" size="large">Create Vote</Button></li>
        <li>
          <a href="https://umijs.org/guide/getting-started.html">
            {formatMessage({ id: 'index.start' })}
          </a>
        </li>
      </ul>
    </div>
  );
}
