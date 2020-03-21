import { connect } from 'dva';
import React, { useEffect } from "react";
import { WallStateType, dispatchFetchVotes } from "@/models/wall";
import { ConnectProps } from "@/models/connect";
import { Table } from 'antd';
import Voting, { Authorization } from '@/types/voting';
import { Link } from 'umi';
import moment from "moment";

interface WallProps extends ConnectProps {
  votes: Voting[]
}

const VotingsTable: React.FC<WallProps> = ({ dispatch, votes }) => {
    useEffect(() => dispatchFetchVotes(dispatch), []);
    const columns = [
        {
          title: 'Title',
          dataIndex: 'title',
          key: 'title',
          render: (title: string, voting: Voting) => (
            <Link to={`/voting/${voting.slug}`}>
              {title}
            </Link>
          )
        },
        {
          title: 'Begin',
          dataIndex: 'startDate',
          key: 'startDate',
          render: (startDate: Date) => <span>{moment().to(startDate)}</span>,
          sorter: (a: Voting, b: Voting) => moment(a.startDate).seconds() - moment(b.startDate).seconds(),
        },
        {
          title: 'End',
          dataIndex: 'endDate',
          key: 'endDate',
          render: (endDate: Date) => <span>{moment().to(endDate)}</span>,
          sorter: (a: Voting, b: Voting) => moment(a.endDate).seconds() - moment(b.endDate).seconds(),
        },
        {
          title: 'Auth',
          dataIndex: 'authorization',
          key: 'authorization',
          render: (auth: Authorization) => <span>{auth.charAt(0).toUpperCase() + auth.substring(1)}</span>,
        },
      ]
    ;
    console.log({ votes });
    return (
      <div>
        <Table pagination={false} columns={columns} dataSource={votes} rowKey={row => row.slug}/>
      </div>
    )
  }
;
export default connect(({ wall }: { wall: WallStateType }) =>
  ({ votes: wall.votes }))(VotingsTable)
