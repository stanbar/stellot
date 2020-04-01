import express from 'express';
import { Authorization } from '@stellot/types';
import { getKeychain, getVotingById } from '../../database/database';
import {
  ChallengeRequest,
  createSession,
  isUserAuthorizedToInitSession,
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
    const voting = await getVotingById(votingId);
    if (!voting) {
      return res.status(404).send(`Voting with id: ${votingId} not found`);
    }
    if (voting.authorization !== Authorization.OPEN) {
      const isUserAuthorized = isUserAuthorizedToInitSession(tokenId, voting);
      if (!isUserAuthorized) {
        return res.status(405).send('Init session failed authorization');
      }
    }
    const keychain = await getKeychain(votingId);
    if (!keychain) {
      return res.status(500).send(`Could not find keychain for votingId ${votingId}`);
    }
    const [sessionId, session] = createSession(tokenId, keychain);
    res.setHeader('SESSION-ID', sessionId);
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
  const sessionId = req.header('SESSION-ID');
  debug(`sessionId: ${sessionId}`);
  if (!sessionId) {
    res.status(405).send('SESSION-ID header not found').end();
  } else {
    const luckyBatchIndex = storeAndPickLuckyBatch(sessionId, blindedTransactionBatches);
    res.status(200).send({ luckyBatchIndex });
  }
});

router.post('/proofChallenges', async (req, res, next) => {
  const { tokenId, proofs }: { tokenId: string; proofs: Proof[] } = req.body;
  debug(`tokenId: ${tokenId}`);
  const sessionId = req.header('SESSION-ID');
  debug(`sessionId: ${sessionId}`);
  if (!sessionId) {
    res.status(405).send('SESSION-ID header not found').end();
  } else {
    try {
      const signedBatch = proofChallenges(sessionId, proofs);
      res.status(200).send(signedBatch);
    } catch (e) {
      next(e);
    }
  }
});

export default router;
