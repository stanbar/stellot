import React from 'react';
import styled from "styled-components";
import VotingsTable from "@/components/VotingsTable";
import { Col } from 'antd';
import { BtnOutlined } from '@/components/ActionButton';
import { PAPER_URL } from "@/constants";
import { CORNFLOWER } from "@/shared/Colors";
import { Title } from "@/components/Title";
import styles from './index.css';
import FAQ from "@/pages/faq";

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
          anonymity. Inherited decentralized and permissionless Stellar blockchain properties, allows everyone to
          verify the election results without having to trust central authority.</SubSubTitle>


        <a href={PAPER_URL} target="_blank" rel="noreferrer noopener">
          <BtnOutlined size="large"
                       color={CORNFLOWER}>
            Whitepaper
          </BtnOutlined>
        </a>
      </Col>
      <TitleParagraph>Explore public votings</TitleParagraph>
      <VotingsTable/>

      <Col md={18} offset={3} className={styles.features} style={{ marginTop: 64 }}>
        <h1>Privacy-first</h1>
        <p>
          Stellot uses blind-signature algorithm to authorize transactions without revealing its content.
        </p>

        <h1>User friendly</h1>
        <p>
          Stellot is designed for mass adoption in mind.
          Users are completely abstracted from blockchain technology used underneath.
        </p>

        <h1>Trustless</h1>
        <p>
          Stellot keeps each ballot publicly on Stellar blockchain, thus everyone is able to calculate the voting
          results by itself.
          Removing the needs to trust central authority.
        </p>

        <h1>Verifiable</h1>
        <p>
          Users publish the vote transaction directly to the stellar blockchain, in result, they can track their vote
          transaction during counting process.
        </p>

        <h1>Fair</h1>
        <p>
          In Stellot, all votes are encrypted until the end of election. No partial results are available.
        </p>
      </Col>
      <Col style={{ marginTop: 64 }}>
        <FAQ className={styles.faq}/>
      </Col>
    </div>
  );
}
