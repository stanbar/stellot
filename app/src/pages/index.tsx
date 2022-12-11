import React from 'react';
import styled from 'styled-components';
import VotingsTable from '@/components/VotingsTable';
import { Col } from 'antd';
import { BtnOutlined } from '@/components/ActionButton';
import { PAPER_URL } from '@/constants';
import { CORNFLOWER } from '@/shared/Colors';
import { Title } from '@/components/Title';
import FAQ from '@/pages/faq';

const SubTitle = styled.h2`
  font-size: 36px;
  font-weight: 500;
  line-height: 1.33;

  margin: 0.67em 0;
  vertical-align: baseline;
  display: block;
`;
const SubSubTitle = styled.p`
  font-size: 18px;
  line-height: 1.67;
  color: #8d91a3;
`;
export const TitleParagraph = styled.h2`
  font-size: 23px;
  line-height: 1.3;
  margin-bottom: 10px;
`;

export const H3 = styled.h3`
  text-align: center;
  font-size: 24px;
  margin-top: 62px;
  font-weight: 500;
  line-height: 1.2;
  color: #1b2448;
`;

export const P = styled.p`
  font-size: 18px;
  line-height: 1.5;
  vertical-align: baseline;
  color: #8d91a3;
`;

const Features = styled(Col)`
  text-align: center;
  margin-bottom: 62px;
  margin-top: 64px;
  margin: auto;
`;
const IndexContainer = styled.div`
  margin-top: 4em;
  margin-bottom: 74px;
`;

export default function () {
  return (
    <IndexContainer>
      <Col style={{ marginBottom: 100 }}>
        <Title>Welcome to Stellot</Title>
        <SubTitle>Stellot is an i-voting platform powered by Stellar blockchain</SubTitle>
        <SubSubTitle>
          Designed with practicality, user-firendliness, anonimty, and security in mind.
          Inherited decentralized and permissionless blockchain properties allow everyone to verify the voting correctness without having to trust a central authority.
        </SubSubTitle>

        <a href={PAPER_URL} target="_blank" rel="noreferrer noopener">
          <BtnOutlined size="large" color={CORNFLOWER}>
            Whitepaper
          </BtnOutlined>
        </a>
      </Col>
      <TitleParagraph>Explore public votings</TitleParagraph>
      <VotingsTable />

      <Features md={18} xs={20} offset={3}>
        <H3>Privacy-first</H3>
        <P>Blind-signature algorithm guarantees users' anonymity during and after the voting process.</P>

        <H3>User friendly</H3>
        <P>
          Stellot is designed with mass adoption in mind. 
          End-users are abstracted from blockchain technology used underneath.
        </P>

        <H3>Trustless</H3>
        <P>
          Stellot records each vote publicly on Stellar blockchain, thus everyone can calculate the voting results by themselves—without having to trust a central authority.
        </P>

        <H3>Verifiable</H3>
        <P>
          Users publish vote-cast transactions directly to the Stellar blockchain; 
          therefore, they can track their vote transactions during the counting process.
        </P>

        <H3>Fair</H3>
        <P>Until the end of the election, all votes are end-to-end encrypted, preventing preliminary results disclosure.</P>
      </Features>
      <FAQ />
    </IndexContainer>
  );
}
