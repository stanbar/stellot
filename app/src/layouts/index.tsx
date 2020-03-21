import React from 'react';
import { Col, Layout } from 'antd';
import Logo from "@/components/Logo";
import { Link } from "umi";
import { ConnectProps } from "@/models/connect";
import { BtnHeading } from "@/components/ActionButton";
import styles from './index.css';
import { GithubOutlined } from '@ant-design/icons';

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
        {location && (location.pathname === '/' || location.pathname === '/wall') &&
        <Link to="/create">
          <BtnHeading className={styles.heading}>
            Create Voting
          </BtnHeading>
        </Link>
        }
      </Header>
      <Content className={styles.content}>
        <Col className={styles.content} sm={{ span: 20, offset: 2 }} md={{ span: 16, offset: 4 }}
             xl={{ span: 14, offset: 5 }}>
          {props.children}
        </Col>
      </Content>
      <Footer style={{ textAlign: 'center', }}>
        <div>
          <a style={{ marginRight: 40, color: '#000000a6', textDecoration: 'none', outline: 0 }}
             href="https://github.com/stasbar/stellar-voting">Source </a>

          <a style={{ marginRight: 40, color: '#000000a6', textDecoration: 'none', outline: 0 }}
             href="https://github.com/stasbar/stellar-voting"><GithubOutlined/></a>

          <a style={{ color: '#000000a6', textDecoration: 'none', outline: 0 }}
             href="https://github.com/stasbar/stellar-voting">Paper</a>
        </div>
        <div>Stellot 2020 build with ❤️to Stellar</div>
      </Footer>
    </Layout>
  )
};

export default BasicLayout;
