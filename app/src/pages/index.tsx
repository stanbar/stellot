import React from 'react';
import styled from "styled-components";
import Wall from "@/pages/wall";
import styles from './index.css';

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

export default function () {
  return (
    <div className={styles.normal}>
      <ul className={styles.list}>
        <Title>Welcome in Stellot</Title>
        <SubTitle>Voting platform backed by Stellar blockchain network</SubTitle>
        <SubSubTitle>Stellot was designed around voter privacy, ensuring that everyone can be sure about it&apos;s vote
          anonimity. Inherit decentralized and permission-less Stellar blockchain properties, allowing everyone to
          verify the election results without having to trust central authority.</SubSubTitle>
        <Wall/>
      </ul>
    </div>
  );
}
