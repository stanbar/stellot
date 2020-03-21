import React from "react";
import styled from 'styled-components'
import { CORNFLOWER, WHITE, DUSTYGRAY } from '@/shared/Colors';


const Btn = styled.button`
  background-color: ${CORNFLOWER};
  border-radius: 5px;
  border: 0;
  color: ${WHITE};
  cursor: pointer;
  font-family: 'Clear Sans Bold','Nitti Grotesk','Museo Sans','Helvetica Neue',Verdana,Arial,sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: initial;
  padding: 14px 0 18px 0;
  &:hover {
    opacity: 0.8;
  }
  &:focus {
    outline: 0;
  }
`;

export const BtnHeading = styled(Btn)<{
  color?: string
  onClick?: (event: React.MouseEvent<any>) => void
}>`
  background-color: ${props => props.color};
  float: right;
  font-size: 16px;
  margin-left: 10px;
  padding: 10px 0;
  width: 120px;
  &:disabled {
    background: ${DUSTYGRAY};
    opacity: 0.6;
    pointer-events: none;
    cursor: default;
  }
`;

export const BtnSubmit = styled(Btn)<{ color?: string }>`
  background-color: ${props => (props.color ? props.color : CORNFLOWER)};
  width: 150px;
  font-size: 16px;
  padding: 10px 0;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const BtnOutlined = styled(Btn)<{ color?: string }>`
  background-color: #00000000;
  color: ${props => (props.color ? props.color : CORNFLOWER)};
  border-color: ${props => (props.color ? props.color : CORNFLOWER)};
  float: right;
  border: 1px solid;
  width: 150px;
  font-size: 16px;
  padding: 10px 0;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
