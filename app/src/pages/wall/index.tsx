import { connect } from 'dva';
import React, { useEffect } from "react";
import { WallStateType, dispatchFetchVotes } from "@/models/wall";
import { ConnectProps } from "@/models/connect";
import { Card } from 'antd';
import Voting from '@/types/voting';
import { Link } from 'umi';

interface WallProps extends ConnectProps {
  votes: Voting[]
}

const Votes: React.FC<WallProps> = ({ dispatch, votes }) => {
    useEffect(() => dispatchFetchVotes(dispatch), []);
    return (
      <div>
        {votes.map(vote => (
          <Link key={vote.id} to={`/voting/${vote.id}`}>
            <Card key={vote.id}>
              <Card.Meta title={vote.title}/>
            </Card>
          </Link>))}
      </div>
    )
  }
;
export default connect(({ wall }: { wall: WallStateType }) =>
  ({ votes: wall.votes }))(Votes)
