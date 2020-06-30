import express, { Request } from 'express';
import { Authorization, Voting, KeybaseAuthOptions, EmailsAuthOptions } from '@stellot/types';
import { uuid } from 'uuidv4';
import createHttpError from 'http-errors';
import { HttpError } from '../../app';
import * as keybase from '../../authorizationServers/keybase';
import * as emails from '../../authorizationServers/emails';
import { createSessionToken, verifyAndGetUserId } from '../../auth';
import { getAuthorizationOptions } from '../../database/authorizationOptions';
import { getVotingById } from '../../database/voting';
import { getKeychain } from '../../database/keychain';
import {
  isUserAuthorizedToInitSession,
  createSession,
  signBlindly,
  verifyAuthorizationToken,
  requestAccountCreation,
} from '../../newSessions';

const debug = require('debug')('blindsig');

const router = express.Router();

// @param:body votingId: string
// @param:header Auth Token: string authorization token from Authenitcation Provider
// return:header SESSION-TOKEN
// return:body initSession: {nonce: Buffer, publicKey: Buffer}
router.post('/init', async (req, res, next) => {
  const { votingId } = req.body;
  debug(`votingId: ${votingId}`);
  try {
    const voting = await getVotingById(votingId);
    if (!voting) {
      throw new createHttpError.NotFound(`Voting with id: ${votingId} not found`);
    }
    let userId: string;
    switch (voting.authorization) {
      case Authorization.OPEN:
      case Authorization.COOKIE:
        userId = uuid();
        break;
      case Authorization.IP:
        userId = req.ip;
        break;
      default:
        userId = await handleExternalAuth(req, voting);
        break;
    }
    const isUserAuthorized = await isUserAuthorizedToInitSession(voting, userId);
    if (!isUserAuthorized) {
      throw new createHttpError.Unauthorized('You have already started voting session');
    }
    const keychain = await getKeychain(votingId);
    if (!keychain) {
      throw new createHttpError.InternalServerError(
        `Could not find keychain for votingId ${votingId}`,
      );
    }
    const session = createSession(voting, userId, keychain);
    debug('created session');
    const sessionToken = createSessionToken(voting.id, userId);
    res.setHeader('SESSION-TOKEN', sessionToken);
    return res.status(200).send(session);
  } catch (e) {
    return next(e);
  }
});

// @param:body challenge: string - BN in hex string representation
// @param:header sessionToken: string - sessionToken allowing to connect user between init and getSignedToken
// @returns blindSignature: string - in hex string format
router.post('/getSignedToken', (req, res, next) => {
  const { challenge }: { challenge: string } = req.body;
  const sessionToken = req.header('SESSION-TOKEN');
  debug(`sessionToken: ${sessionToken}`);
  try {
    if (!sessionToken) throw new createHttpError.BadRequest('SESSION-TOKEN header not found');

    const { userId, votingId } = verifyAndGetUserId(sessionToken);

    if (!userId)
      throw new createHttpError.Unauthorized('Provided JWT does not contain userId field');
    if (!votingId)
      throw new createHttpError.Unauthorized('Provided JWT does not contain votingId field');

    const blindedSignature = signBlindly(votingId, userId, challenge);
    res.status(200).send({ blindedSignature });
  } catch (e) {
    return next(e);
  }
});

// @param:body voterPublicKey: string
// @param:body votingId: string
// @param:body authorizationToken: { message: string; signature: string }
// @returns accountCreation transaction
router.post('/requestAccountCreation', async (req, res, next) => {
  const {
    voterPublicKey,
    votingId,
    authorizationToken,
  }: {
    voterPublicKey: string;
    votingId: string;
    authorizationToken: { message: string; signature: string };
  } = req.body;
  console.log({ voterPublicKey, votingId, authorizationToken });

  try {
    if (!voterPublicKey || !votingId || !authorizationToken) {
      let errorMessage = '';
      if (!voterPublicKey) errorMessage += 'voterPublicKey body not found\n';
      if (!authorizationToken) errorMessage += 'authorizationToken body not found\n';
      throw new HttpError(errorMessage, 401);
    }
    if (
      !verifyAuthorizationToken(
        Buffer.from(authorizationToken.message, 'hex'),
        Buffer.from(authorizationToken.signature, 'hex'),
        votingId,
      )
    ) {
      throw new HttpError('Provided JWT does not contain userId field', 405);
    }

    const tx = await requestAccountCreation(votingId, voterPublicKey);
    return res.status(200).send({ transactionXdr: tx.toXDR() });
  } catch (e) {
    return next(e);
  }
});

async function handleExternalAuth(req: Request, voting: Voting): Promise<string> {
  const authToken = getAuthTokenFromHeader(req);
  debug(`authToken: ${authToken}`);
  if (!authToken) {
    throw new HttpError('missing Authorization header with Bearer JWT', 401);
  }

  let userId;
  const options = await getAuthorizationOptions(voting);
  switch (voting.authorization) {
    case Authorization.KEYBASE:
      userId = keybase.authorizeAndAuthenticateToken(authToken, options as KeybaseAuthOptions);
      break;
    case Authorization.EMAILS:
      userId = emails.authorizeAndAuthenticateToken(authToken, options as EmailsAuthOptions);
      break;
    default:
      throw new createHttpError.NotImplemented('Authorization method not implemented yet');
  }
  return userId;
}

function getAuthTokenFromHeader(req: Request) {
  if (
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
  ) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

export default router;
