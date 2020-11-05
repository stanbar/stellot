import React from "react";
import styled from 'styled-components'
import { CORNFLOWER, WHITE, DUSTYGRAY } from '@/shared/Colors';
import { Button } from "antd";


const Btn = styled(Button)`
  display: inline-block;
  background-color: ${CORNFLOWER};
  border-radius: 8px;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  justify-content: center;
  text-decoration: none;
  text-transform: uppercase;
  border: 0;
  color: ${WHITE};
  cursor: pointer;
  font-family: 'Clear Sans Bold','Nitti Grotesk','Museo Sans','Helvetica Neue',Verdana,Arial,sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0;
  margin-top: auto;
  letter-spacing: 1px;
  cursor: pointer;
  vertical-align: baseline;

  @media (max-width: 479px) {
    padding-left: 11px;
    padding-right: 11px;
  }

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
  background-color: ${props => (props.color ? props.color : CORNFLOWER)};
  color: ${WHITE};
  border-color: ${props => (props.color ? props.color : CORNFLOWER)};
  float: right;
  &:disabled {
    background: ${DUSTYGRAY};
    opacity: 0.6;
    pointer-events: none;
    cursor: default;
  }
  &:hover {
    color: ${WHITE};
    background-color: ${props => (props.color ? props.color : CORNFLOWER)};
  }
`;

export const BtnOutlined = styled(Btn)<{ color?: string }>`
  background-color: ${WHITE};
  color: ${props => (props.color ? props.color : CORNFLOWER)};
  border-color: ${props => (props.color ? props.color : CORNFLOWER)};
  float: right;
  border: 2px solid;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  &:hover {
    color: ${props => (props.color ? props.color : CORNFLOWER)};
    background-color: #00000000;
    border-color: ${props => (props.color ? props.color : CORNFLOWER)};
  }
`;

export const BtnSubmit = styled(Btn)<{ color?: string }>`
  background-color: ${props => (props.color ? props.color : CORNFLOWER)};
  width: 150px;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;


export const BtnLink = styled(Btn)<{ color?: string }>`
  background-color: #00000000;
  color: ${props => (props.color ? props.color : CORNFLOWER)};
  width: 150px;
  font-size: 16px;
  padding: 10px 0;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
