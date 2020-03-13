import React from 'react';
import { Card, Col, Layout } from 'antd';
import logo from '@/assets/stellotLogo.png';
import styles from './index.css';

const { Header, Footer, Content } = Layout;

/* eslint-disable jsx-a11y/accessible-emoji */
/* eslint-disable jsx-a11y/alt-text */
const BasicLayout: React.FC = props => (
  <Layout className={styles.normal}>
    <Header className={styles.header}>
      <img className={styles.logo} alt="Stellot" src={logo}/>
    </Header>
    <Content className={styles.siteLayoutContent}>
      <Col sm={{ span: 20, offset: 2 }} xl={{ span: 16, offset: 4 }}>
        <Card>
          <Col sm={{ span: 20, offset: 2 }} xl={{ span: 16, offset: 4 }}>
            <div>{props.children}</div>
          </Col>
        </Card>
      </Col>
    </Content>
    <Footer style={{ textAlign: 'center' }}>Stellot 2020 build with ❤️to Stellar</Footer>
  </Layout>
);

export default BasicLayout;
