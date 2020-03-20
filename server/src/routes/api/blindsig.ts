import express from 'express';
import { votingExists } from '../../database/database';
import {
  ChallengeRequest,
  createSession,
  isAlreadyInitedSession,
  Proof,
  proofChallenges,
  storeAndPickLuckyBatch,
} from '../../stellar';

const debug = require('debug')('stellar-voting:app');

const router = express.Router();

router.post('/init', async (req, res, next) => {
  const { tokenId, votingId } = req.body;
  debug(`tokenId: ${tokenId}`);
  debug(`votingId: ${votingId}`);
  try {
    const isAlreadyInited = isAlreadyInitedSession(tokenId, votingId);
    if (isAlreadyInited) {
      return res.status(405).send('Session already inited');
    }
    const voting = await votingExists(votingId);
    if (!voting) {
      return res.status(404).send(`Voting with id: ${votingId} not found`);
    }
    const session = createSession(tokenId, votingId);
    return res.status(200).send(session);
  } catch (e) {
    return next(e)
  }
});

router.post('/getChallenges', (req, res) => {
  const {
    tokenId,
    blindedTransactionBatches,
  }: { tokenId: string; blindedTransactionBatches: ChallengeRequest } = req.body;
  debug(`tokenId: ${tokenId}`);
  const luckyBatchIndex = storeAndPickLuckyBatch(tokenId, blindedTransactionBatches);
  return res.status(200).send({ luckyBatchIndex });
});

router.post('/proofChallenges', async (req, res, next) => {
  const { tokenId, proofs }: { tokenId: string; proofs: Proof[] } = req.body;
  debug(`tokenId: ${tokenId}`);
  try {
    const signedBatch = proofChallenges(tokenId, proofs);
    res.status(200).send(signedBatch);
  } catch (e) {
    next(e);
  }
});

export default router;
