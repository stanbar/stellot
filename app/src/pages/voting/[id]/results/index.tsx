import React, { useEffect, useState } from 'react';
import {
  dispatchFetchVoting,
  VotingStateType,
  VOTING,
  FETCH_VOTING,
  FETCH_RESULTS,
  dispatchFetchResults
} from "@/models/voting";
import { ConnectProps, Loading } from "@/models/connect";
import { connect } from 'dva';
import { Voting } from "@stellot/types";
import { VoteStatus } from '@/types/voteStatus';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Sector,
} from 'recharts';
import Result from '@/types/result';
import { BtnSubmit } from "@/components/ActionButton";
import { Link } from 'umi';
import VotingMetadata from "@/components/VotingMetadata";
import { Switch, Card, Skeleton, Button, Tooltip as AntTooltip } from 'antd';
import {
  PieChartOutlined,
  BarChartOutlined,
  AuditOutlined,
  DownOutlined,
  UpOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { BallotBoxIcon } from '@/assets/BallotBoxIcon';
import * as storage from "@/storage"
import EncryptedDecrypted from "@/components/EncryptedDecrypted";
import { copyTextToClipboard } from "@/utils/utils";
import styles from './styles.css'
import moment from 'moment';


interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
  loadingResults?: boolean;
  results?: Result[];
  myHash?: string
  myMemo?: string | Buffer
}

enum ChartType {
  // eslint-disable-next-line no-shadow
  Pie, Bar
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>{value} Votes</text>
      <text x={cx} y={cy} dy={28} textAnchor="middle" fill="#999">{(percent * 100).toFixed(2)}%</text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{payload.name}</text>
    </g>
  );
};

const VoteResults: React.FC<VotePreviewProps> = props => {
  const { loading, loadingResults, results, match, dispatch, voting, } = props;
  const myTransaction = voting ? storage.getMyTransaction(voting.id) : undefined;
  const { myTxHash, myTxMemo } = myTransaction || {};
  const votingSlug = match?.params['id']!; // We can safely use ! because, undefined id is handled by vote/index
  const [chart, setChart] = useState<ChartType>(ChartType.Bar)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [showMyVote, setShowMyVote] = useState<boolean>(false)


  useEffect(() => {
    if (!voting) {
      dispatchFetchVoting(dispatch, votingSlug)
    }
  }, [votingSlug, voting]);

  useEffect(() => {
    if (voting) {
      dispatchFetchResults(dispatch, voting)
    }
  }, [voting]);

  if (loading) {
    return (<><p>Loading voting metadata...</p><Skeleton active /></>)
  }
  if (loadingResults) {
    return (<><p>Loading results from stellar blockchain...</p><Skeleton active /></>)
  }
  if (!voting) {
    return (<p>Failed to load voting</p>)
  }
  if (voting.encryption && !voting.encryption.decryptionKey) {
    return (
      <div>
        <VotingMetadata voting={voting} />
        <p>Results are encrypted until {moment(voting.encryption.encryptedUntil).format('lll')} ({moment(voting.encryption.encryptedUntil).toNow()})</p>
        <div style={{ float: 'right', marginBottom: 24, marginTop: 12 }}>
          <Link to="/wall">
            <BtnSubmit type="primary" size="large">
              More
          </BtnSubmit>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <VotingMetadata voting={voting} />
      <div style={{ float: 'right' }}>
        <Switch
          className={styles.switch}
          onChange={checked => setChart(checked ? ChartType.Bar : ChartType.Pie)}
          checkedChildren={<BarChartOutlined />}
          unCheckedChildren={<PieChartOutlined />}
          defaultChecked
        />
      </div>
      <h3 style={{ marginBottom: 24 }}>{voting?.polls[0].question}</h3>

      {chart === ChartType.Bar &&
        <ResponsiveContainer width="100%" height={100 + (results?.length || 0) * 50}>
          <BarChart
            layout="vertical"
            data={results}
            margin={{
              top: 5, bottom: 5,
            }}
          >
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" />
            <Tooltip />
            <Legend />
            <Bar dataKey="votes" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      }

      {chart === ChartType.Pie &&
        <ResponsiveContainer width="100%" maxHeight={400} aspect={1}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={results}
              dataKey="votes"
              innerRadius="50%"
              outerRadius="80%"
              fill="#8884d8"
              onMouseEnter={(data, index) => setActiveIndex(index)}
            />
          </PieChart>
        </ResponsiveContainer>
      }


      {myTxHash && myTxMemo &&
        <Button type="link" onClick={() => setShowMyVote(!showMyVote)}>
          <span style={{ marginLeft: 2 }}>{showMyVote ? <UpOutlined /> : <DownOutlined />}My vote</span>
        </Button>
      }
      <a rel="noopener noreferrer" target="_blank"
        href={`https://testnet.lumenscan.io/account/${voting.distributionAccountId}`}>
        <Button type="link" icon={<AuditOutlined />}>
          <span style={{ marginLeft: 2 }}>Distribution account</span>
        </Button>
      </a>

      <a rel="noopener noreferrer" target="_blank"
        href={`https://testnet.lumenscan.io/account/${voting.ballotBoxAccountId}`}>
        <Button type="link" icon={<BallotBoxIcon />}>
          <span style={{ marginLeft: 2 }}>Ballot-box account</span>
        </Button>
      </a>
      {showMyVote && myTxHash && myTxMemo &&
        <>

          <Card
            title={<AntTooltip title="Copy to clipboard">
              <h2 style={{ cursor: 'pointer' }} onClick={() => copyTextToClipboard(myTxHash)}
                className={styles.myVoteCardTitle}>{myTxHash}</h2>
            </AntTooltip>}
            extra={[<AntTooltip
              title="This information is stored in your browser only, if you clear it, you will be unable to track your vote. Store the vote identifier in safe place."><QuestionCircleOutlined /></AntTooltip>]}
            actions={[
              <a rel="noopener noreferrer" target="_blank" href={`https://testnet.lumenscan.io/txns/${myTxHash}`}>
                Show in blockchain</a>
            ]} style={{ maxWidth: 350 }}>

            <p className={styles.option}>
              Option: <EncryptedDecrypted voting={voting} myTxMemo={myTxMemo} />
            </p>
          </Card>
        </>
      }

      <div style={{ float: 'right', marginBottom: 24, marginTop: 12 }}>
        <Link to="/wall">
          <BtnSubmit type="primary" size="large">
            More
          </BtnSubmit>
        </Link>
      </div>
    </div>
  );
};
export default connect(({ voting, loading }: { voting: VotingStateType, loading: Loading }) =>
  ({
    voting: voting.voting,
    status: voting.status,
    loading: loading.effects[`${VOTING}/${FETCH_VOTING}`],
    loadingResults: loading.effects[`${VOTING}/${FETCH_RESULTS}`],
    results: voting.results,
  }))(VoteResults);
