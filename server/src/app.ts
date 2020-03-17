import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import crypto from 'crypto';
import errorhandler from 'errorhandler';
import mongoose from 'mongoose';
import {
  isAlreadyInitedSession,
  createSession,
  ChallengeRequest,
  storeAndPickLuckyBatch,
  proofChallenges,
  Proof,
} from './stellar';
import * as database from './database/database';
import { getAllPublicVotes, getVoting } from './database/database';
import { createVoting } from './createVoting';

const debug = require('debug')('stellar-voting:app');

const isProduction = process.env.NODE_ENV === 'production';

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
if (!isProduction) {
  app.use(errorhandler());
}
if (isProduction) {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set');
  }
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect('mongodb://localhost/stellar-voting');
  mongoose.set('debug', true);
}

import Voting from './database/models/Voting';




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
  const { votingId } = req.body;
  console.log({ body: req.body });
  if (!votingId) {
    return res.sendStatus(400).end();
  }
  return res
    .json(getVoting(votingId))
    .end();
});

app.get('/api/wall', async (req, res) => {
  const result = await Voting.find({});
  res.json(result);
});

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
