import express, { Request } from 'express';
import { Authorization, Voting } from '@stellot/types';
import { uuid } from 'uuidv4';
import createHttpError from 'http-errors';
import { getKeychain, getVotingById } from '../../database/database';
import {
  ChallengeRequest,
  createSession,
  isUserAuthorizedToInitSession,
  Proof,
  proofChallenges,
  storeAndPickLuckyBatch,
} from '../../sessions';
import { HttpError } from '../../app';
import * as keybase from '../../authorizationServers/keybase';
import * as emails from '../../authorizationServers/emails';
import { createSessionToken, verifyAndGetUserId } from '../../auth';

const debug = require('debug')('blindsig');

const router = express.Router();

function getTokenFromHeader(req: Request) {
  if ((req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

async function handleExternalAuth(req: Request, voting: Voting): string {
  const authToken = getTokenFromHeader(req);
  debug(`authToken: ${authToken}`);
  if (!authToken) {
    throw new HttpError('missing Authorization header with Bearer JWT', 401)
  }

  let userId
  switch (voting.authorization) {
    case Authorization.KEYBASE:
      userId = await keybase.authenticateToken(authToken, voting);
      break;
    case Authorization.EMAILS:
      userId = await emails.authenticateToken(authToken, voting);
      break;
    default:
      throw new createHttpError.NotImplemented('Authorization method not implemented yet');
  }
  return userId
}

router.post('/init', async (req, res, next) => {
  const { votingId } = req.body;
  debug(`votingId: ${votingId}`);
  try {
    const voting = await getVotingById(votingId);
    if (!voting) {
      return res.status(404).send(`Voting with id: ${votingId} not found`);
    }
    let userId: string;
    switch (voting.authorization) {
      case Authorization.OPEN:
      case Authorization.COOKIE:
        userId = uuid();
        break;
      case Authorization.IP:
        userId = req.ip
        break;
      default:
        userId = await handleExternalAuth(req, voting)
        break;
    }
    const isUserAuthorized = await isUserAuthorizedToInitSession(voting, userId);
    if (!isUserAuthorized) {
      throw new createHttpError.Unauthorized('You have already started voting session');
    }
    const keychain = await getKeychain(votingId);
    if (!keychain) {
      return res.status(500).send(`Could not find keychain for votingId ${votingId}`);
    }
    const session = createSession(voting, userId, keychain);
    debug('created session');
    const sessionToken = createSessionToken(voting, userId);
    res.setHeader('SESSION-TOKEN', sessionToken);
    return res.status(200).send(session);
  } catch (e) {
    return next(e)
  }
});

router.post('/getChallenges', (req, res) => {
  const {
    blindedTransactionBatches,
  }: { tokenId: string; blindedTransactionBatches: ChallengeRequest } = req.body;
  const sessionToken = req.header('SESSION-TOKEN');
  debug(`sessionToken: ${sessionToken}`);
  if (!sessionToken) {
    res.status(401).send('SESSION-TOKEN header not found').end();
  } else {
    const { userId, votingId } = verifyAndGetUserId(sessionToken);
    if (!userId) {
      throw new HttpError('Provided JWT does not contain userId field', 405)
    }
    if (!votingId) {
      throw new HttpError('Provided JWT does not contain votingId field', 405)
    }
    const luckyBatchIndex = storeAndPickLuckyBatch(votingId, userId, blindedTransactionBatches);
    res.status(200).send({ luckyBatchIndex });
  }
});

router.post('/proofChallenges', async (req, res, next) => {
  const { proofs }: { tokenId: string; proofs: Proof[] } = req.body;
  const sessionToken = req.header('SESSION-TOKEN');
  debug(`sessionToken: ${sessionToken}`);
  if (!sessionToken) {
    return res.status(401).send('SESSION-TOKEN header not found').end();
  }
  try {
    const { userId, votingId } = verifyAndGetUserId(sessionToken);
    if (!userId) {
      throw new HttpError('Provided JWT does not contain userId field', 405)
    }
    if (!votingId) {
      throw new HttpError('Provided JWT does not contain votingId field', 405)
    }
    const signedBatch = proofChallenges(votingId, userId, proofs);
    return res.status(200).send(signedBatch);
  } catch (e) {
    return next(e);
  }
});

export default router;
