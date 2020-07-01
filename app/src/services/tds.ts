import { Voting, CreateVotingRequest, CreateVotingResponse } from '@stellot/types';

const BASE_URL = REACT_APP_ENV === 'production' ? TDS_SERVER_URL : '';

export async function fetchVotes(): Promise<Voting[]> {
  const res = await fetch(`${BASE_URL}/api/voting`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function fetchVoting(votingSlug: string): Promise<Voting> {
  console.log({ fetchVoting: votingSlug });
  const res = await fetch(`${BASE_URL}/api/voting/${votingSlug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

export async function createVoting(
  createVotingRequest: CreateVotingRequest,
): Promise<CreateVotingResponse> {
  const response = await fetch(`${BASE_URL}/api/voting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ createVotingRequest }),
  });

  if (response.ok) {
    console.log('Successfully created voting');
  } else {
    console.error('Failed to create voting');
    throw new Error(await response.text());
  }
  return response.json();
}
