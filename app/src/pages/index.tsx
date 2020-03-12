import React from 'react';
import styles from './index.css';
import { formatMessage } from 'umi-plugin-locale';
import { Typography, Button } from 'antd';
import { Link } from "umi";

export default function () {
  return (
    <div className={styles.normal}>
      <ul className={styles.list}>
        <Typography.Title>Welcome in Stellot - Voting platform build with ❤️ to Stellar</Typography.Title>
        <li>
          <Link to={"/create"}><Button type="primary" size="large">Create Vote</Button></Link></li>
        <li>
          <a href="https://umijs.org/guide/getting-started.html">
            {formatMessage({ id: 'index.start' })}
          </a>
        </li>
      </ul>
    </div>
  );
}
