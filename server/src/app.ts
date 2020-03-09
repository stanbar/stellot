import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import crypto from 'crypto';
// import debug from 'debug';

import {
  isAlreadyInitedSession,
  createSession,
  ChallengeRequest,
  storeAndPickLuckyBatch,
  proofChallenge,
  Proof,
} from './stellar';

// const log = debug('server:app');
const app = express();
export default app;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../docs')));

app.post('/api/init', async (req, res) => {
  const { tokenId } = req.body;
  const isAlreadyInited = isAlreadyInitedSession(tokenId);
  if (isAlreadyInited) {
    return res.status(405).send('Session already inited');
  }
  const session = createSession(tokenId);
  return res.status(200).send(session);
});

app.post('/api/getChallenge', async (req, res) => {
  const { tokenId, blindedTransactionBatches }
    : { tokenId: string, blindedTransactionBatches: ChallengeRequest } = req.body;
  const luckyBatchIndex = storeAndPickLuckyBatch(tokenId, blindedTransactionBatches);
  return res.status(200).send({ luckyBatchIndex });
});

app.post('/api/proofChallenge', async (req, res) => {
  const { tokenId, proofs }: { tokenId: string, proofs: Proof[] } = req.body;
  try {
    const signedBatch = proofChallenge(tokenId, proofs);
    return res.status(200).send(signedBatch);
  } catch (e) {
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

if (!process.env.WEBAPP_DIR) {
  throw new Error('Could not find webapp dir');
}

// app.use('/*', (req, res) => {
//   res.sendFile(path.join(process.env.WEBAPP_DIR!, 'index.html'));
// });
