import React from 'react';
import styled from "styled-components";
import VotingsTable from "@/components/VotingsTable";
import { Button, Col } from 'antd';
import { BtnHeading, BtnOutlined } from '@/components/ActionButton';
import { PAPER_URL } from "@/constants";
import styles from './index.css';
import Lottie from "@/components/Lottie";
import shareButton from "@/assets/lottie/84-document-white-paper-outline.json"

const Title = styled.h1`
font-size: 28px;
font-weight: 300;
`;
const SubTitle = styled.h2`
font-size: 36px;
font-weight: 500;
line-height: 1.33;
`;
const SubSubTitle = styled.p`
font-size: 18px;
line-height: 1.67;
`;
export const TitleParagraph = styled.h2`
font-size: 23px;
line-height: 1.3;
margin-bottom: 10px;
`;

export default function () {
  return (
    <div className={styles.normal}>
      <Col style={{ marginBottom: 100 }}>
        <Title>Welcome in Stellot</Title>
        <SubTitle>Voting platform backed by Stellar blockchain network</SubTitle>
        <SubSubTitle>Stellot is designed around voter privacy, ensuring that everyone can be sure about its vote
          anonimity. Inherited decentralized and permissionless Stellar blockchain properties, allows everyone to
          verify the election results without having to trust central authority.</SubSubTitle>


        <a href={PAPER_URL} target="_blank" rel="noreferrer noopener"><BtnOutlined>
          <Lottie
            style={{
              width: '1.5em',
              height: '1.5em',
            }}
            options={{
              animationData: shareButton,
              loop: true,
              autoplay: false,
            }}
          />
          <span style={{lineHeight: '1'}}>Whitepaper</span>
        </BtnOutlined></a>

      </Col>
      <TitleParagraph>Explore public votings</TitleParagraph>
      <VotingsTable/>
    </div>
  );
}
