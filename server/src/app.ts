import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import crypto from 'crypto';

import {
  isAlreadyInitedSession,
  createSession,
  ChallengeRequest,
  storeAndPickLuckyBatch,
  proofChallenges,
  Proof,
} from './stellar';
import * as database from './database';
import { getAllPublicVotes } from './database';
import { createVoting } from './createVoting';

const debug = require('debug')('stellar-voting:app');

const app = express();
export default app;

app.use(logger('dev'));
app.use(express.json({ limit: '0.5mb' }));
app.use(express.urlencoded({ limit: '0.5mb', extended: false }));
app.use(cookieParser());
if (!process.env.WEBAPP_DIR) {
  throw new Error('Could not find webapp dir');
}
app.use(express.static(process.env.WEBAPP_DIR!));

app.post('/api/init', async (req, res) => {
  const { tokenId, votingId } = req.body;
  debug(`tokenId: ${tokenId}`);
  const isAlreadyInited = isAlreadyInitedSession(tokenId, votingId);
  if (isAlreadyInited) {
    return res.status(405).send('Session already inited');
  }
  const voting = database.getVoting(votingId);
  const session = createSession(tokenId, voting);
  return res.status(200).send(session);
});

app.post('/api/getChallenges', async (req, res) => {
  const { tokenId, blindedTransactionBatches }
    : { tokenId: string, blindedTransactionBatches: ChallengeRequest } = req.body;
  debug(`tokenId: ${tokenId}`);
  const luckyBatchIndex = storeAndPickLuckyBatch(tokenId, blindedTransactionBatches);
  return res.status(200).send({ luckyBatchIndex });
});

app.post('/api/proofChallenges', async (req, res) => {
  const { tokenId, proofs }: { tokenId: string, proofs: Proof[] } = req.body;
  debug(`tokenId: ${tokenId}`);
  try {
    const signedBatch = proofChallenges(tokenId, proofs);
    return res.status(200).send(signedBatch);
  } catch (e) {
    console.error(e);
    return res.status(405).send(e.message);
  }
});


// Mock of Authorization Provider
app.post('/api/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.sendStatus(400).end();
  }
  return res
    .json({
      userId: crypto
        .createHmac('sha256', process.env.ISSUE_SECRET_KEY!)
        .update(login)
        .digest('hex')
        .substring(0, 16),
    })
    .end();
});


app.post('/api/voting', (req, res) => {
  const { voteId } = req.body;
  if (voteId) {
    return res.sendStatus(400).end();
  }
  return res
    .json(getAllPublicVotes()[0])
    .end();
});

app.get('/api/wall', (req, res) => res.json(getAllPublicVotes()));

app.post('/api/createVoting', async (req, res) => {
  const { createVotingRequest } = req.body;
  if (!createVotingRequest) {
    return res.sendStatus(400).end();
  }
  try {
    const createVotingResponse = await createVoting(createVotingRequest);
    return res.json(createVotingResponse).end();
  } catch (e) {
    console.error(e.response.data.extras);
    return res.status(500).end();
  }
});
