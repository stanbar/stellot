import React, { useEffect } from 'react';
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
import Voting from "@/types/voting";
import { VoteStatus } from '@/types/voteStatus';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import Result from '@/types/result';
import { BtnSubmit } from "@/components/ActionButton";
import { Link } from 'umi';
import VotingMetadata from "@/components/VotingMetadata";

interface VotePreviewProps extends ConnectProps {
  voting?: Voting;
  status?: VoteStatus;
  loading?: boolean;
  loadingResults?: boolean;
  results?: Result[];
}

const VoteResults: React.FC<VotePreviewProps> = props => {
  const { loading, loadingResults, results, match, dispatch, voting } = props;
  const votingSlug = match?.params['id']!; // We can safely use ! because, undefined id is handled by vote/index

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
    return (<p>Loading voting metadata...</p>)
  }
  if (loadingResults) {
    return (<p>Loading results from stellar blockchain...</p>)
  }
  if (!voting) {
    return (<p>Failed to load voting</p>)
  }
  return (
    <div>
      <VotingMetadata voting={voting}/>
      <h4 style={{ marginBottom: 24 }}>{voting?.polls[0].question}</h4>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={results}
          margin={{
            top: 5, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis dataKey="name"/>
          <YAxis/>
          <Tooltip/>
          <Legend/>
          <Bar dataKey="votes" fill="#8884d8"/>
        </BarChart>
      </ResponsiveContainer>

      <Link to="/wall">
        <BtnSubmit style={{ float: 'right', marginBottom: 24, marginTop: 12 }}>
          More
        </BtnSubmit>
      </Link>
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
