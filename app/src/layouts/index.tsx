import React from 'react';
import styles from './index.css';
import { Layout, Typography } from 'antd';
import logo from '@/assets/stellotLogo.png';

const { Header, Footer, Content } = Layout;

const BasicLayout: React.FC = props => {
  return (
    <Layout className={styles.normal}>
      <Header className={styles.header}>
        <img className={styles.logo} src={logo}/>
      </Header>
      <Content className={styles.siteLayoutContent}>
        <div>{props.children}</div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Stellot 2020 build with ❤️to Stellar</Footer>
    </Layout>
  );
};

export default BasicLayout;
