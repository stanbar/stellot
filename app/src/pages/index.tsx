import React from 'react';
import styles from './index.css';
import { Typography, Button } from 'antd';
import { Link } from "umi";

export default function () {
  return (
    <div className={styles.normal}>
      <ul className={styles.list}>
        <Typography.Title>Welcome in Stellot - Voting platform backed by Stellar blockchain network</Typography.Title>
        <li>
          <Link to="/create"><Button type="primary" size="large">Create Vote</Button></Link>
        </li>
        <li>
          <Link to="/wall"><Button type="dashed" size="large">Explore</Button></Link>
        </li>
      </ul>
    </div>
  );
}
