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

const Wall: React.FC<WallProps> = ({ dispatch, votes }) => {
    useEffect(() => dispatchFetchVotes(dispatch), []);
    return (
      <div>
        {votes.map(vote => (
          <Link key={vote.slug} to={`/voting/${vote.slug}`}>
            <Card key={vote.slug}>
              <Card.Meta title={vote.title}/>
            </Card>
          </Link>))}
      </div>
    )
  }
;
export default connect(({ wall }: { wall: WallStateType }) =>
  ({ votes: wall.votes }))(Wall)
