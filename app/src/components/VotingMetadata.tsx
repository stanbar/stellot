import React from "react";
import styled from "styled-components";
import { Voting, Authorization, Visibility } from "@stellot/types";
import {
  EyeOutlined,
  KeyOutlined,
  LinkOutlined,
  LockOutlined,
  MailOutlined,
  NotificationOutlined
} from "@ant-design/icons/lib";
import { capitalize } from "@/utils/utils";
import moment from "moment";

export const Badge = styled.span`
      display: inline-block;
      background: #e2f7f3;
      color: #41ccb4;
      padding: 5px 6px 5px 5px;
      border-radius: 5px;
      border: 0;
      font-size: 100%;
      vertical-align: baseline;
      margin-right: 4px;
  `;

export const Caption = styled.p`
    font-size: .833rem;
    line-height: 1.4;
    font-weight: 500;
    font-family: inherit;
`;

const VotingMetadata: React.FC<{ voting: Voting }> = ({ voting }) => (
  <div>
    <h1 style={{ marginTop: 8, fontSize: '2rem' }}>{voting?.title}</h1>
    <div style={{ fontSize: 12 }}>
      <Caption>
        <Badge>
          {{
            [Visibility.PUBLIC]: <EyeOutlined/>,
            [Visibility.UNLISTED]: <LinkOutlined/>,
            [Visibility.PRIVATE]: <LockOutlined/>,
          }[voting?.visibility]}
          <span style={{ marginLeft: 2 }}>{capitalize(voting?.visibility)}</span>
        </Badge>
        <Badge>
          {{
            [Authorization.OPEN]: <NotificationOutlined/>,
            [Authorization.EMAIL]: <MailOutlined/>,
            [Authorization.CODE]: <KeyOutlined/>,
            [Authorization.KEYBASE]: <KeyOutlined/>,
          }[voting?.authorization]}
          <span style={{ marginLeft: 2 }}>{capitalize(voting?.authorization)}</span>
        </Badge>
        <span style={{ color: '#999' }}>
          <span style={{ marginRight: 4 }}>
            {moment(voting?.startDate).format('ll')}
          </span>
          -
          <span style={{ marginLeft: 4 }}>
            {moment(voting?.endDate).format('ll')}
          </span>
        </span>
      </Caption>
    </div>
  </div>
);

export default VotingMetadata;
