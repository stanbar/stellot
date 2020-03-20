import React from 'react';
import { Col, Layout } from 'antd';
import Logo from "@/components/Logo";
import { Link } from "umi";
import { BtnHeading } from '@/components/ActionButton';
import styles from './index.css';
import { ConnectProps } from "@/models/connect";

const { Header, Footer, Content } = Layout;

interface LayoutProps extends ConnectProps {

}

/* eslint-disable jsx-a11y/accessible-emoji */
/* eslint-disable jsx-a11y/alt-text */
const BasicLayout: React.FC<LayoutProps> = props => {
  const { route, computedMatch, location } = props;
  console.log({ route, location, computedMatch });

  return (
    <Layout className={styles.normal}>
      <Header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <Logo large={false}/>
        </Link>
        <Link to="/create">
          <BtnHeading className={styles.heading}>
            Create Voting
          </BtnHeading>
        </Link>
      </Header>
      <Content>
        <Col className={styles.content} sm={{ span: 20, offset: 2 }} xl={{ span: 16, offset: 4 }}>
          <div>{props.children}</div>
        </Col>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Stellot 2020 build with ❤️to Stellar</Footer>
    </Layout>
  )
};

export default BasicLayout;
