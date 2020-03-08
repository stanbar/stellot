import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import crypto from 'crypto';
import elliptic from 'elliptic';
import debug from 'debug';
import { getRandomInt } from './utils';
import { distributionKeypair } from './stellar';
import { VoterSession, SignerSession } from './blindsig';

const log = debug('server:app');
const { eddsa } = elliptic;
const ed25519 = new eddsa('ed25519');
const app = express();
export default app;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../docs')));

const parties = [
  {
    name: 'PiS',
    code: 0,
  },
  {
    name: 'PO',
    code: 1,
  },
  {
    name: 'SLD',
    code: 2,
  },
  {
    name: 'Konfederacja',
    code: 3,
  },
];

// {
//  id: string,
//  K: BN,
//  blindedTransaction?: Buffer,
//  a?: BN,
//  b?: BN,
//  transaction?: XDR
// }

const sessions = {};

function isAlreadyInitedSession(tokenId) {
  return sessions[tokenId] !== undefined;
}

const cutAndChooseCount = 100;

function createSession(tokenId: string) {
  const keyPair = ed25519.keyFromSecret(distributionKeypair.rawSecretKey());
  const userSessions = new Array(cutAndChooseCount);
  const response = new Array(cutAndChooseCount);
  for (let i = 0; i < cutAndChooseCount; i += 1) {
    const signerSession = new SignerSession(keyPair);
    userSessions[i] = signerSession;
    response[i] = { id: i, R: signerSession.publicNonce() };
  }
  sessions[tokenId] = userSessions;
  return response;
}

app.post('/init', async (req, res) => {
  const { tokenId } = req.body;
  const isAlreadyInited = isAlreadyInitedSession(tokenId);
  if (isAlreadyInited) {
    return res.status(405).send('Session already inited');
  }
  const session = createSession(tokenId);
  return res.status(200).send(session);
});

function validateSessions(currentSession, updatedSession) {
  if (updatedSession.blindedTransaction !== undefined) {
    throw new Error('blindedTransaction is undefined');
  }
  if (updatedSession.id !== currentSession.id) {
    throw new Error(`updatedSession.id: ${updatedSession.id} doesn't match
      currentSession.id: ${currentSession.id}`);
  }
  if (updatedSession.K !== currentSession.K) {
    throw new Error(`updatedSession.K: ${updatedSession.K} doesn't match
      currentSession.K: ${currentSession.K}`);
  }
}

function storeAndPickLuckyTransaction(tokenId, blindedTransactions) {
  const userSessions = sessions[tokenId];
  const luckyTransaction = getRandomInt(sessions.length);
  blindedTransactions[luckyTransaction].lucky = true;
  // save number of attempts preventing DoS
  blindedTransactions.forEach(blindedTransaction => {
    userSessions[session.id].blindedTransaction = blindedTransaction;
  });
  return luckyTransaction;
}

app.post('/getChallenge', async (req, res) => {
  const { tokenId, blindedTransactions } = req.body;
  const luckyTransaction = storeAndPickLuckyTransaction(tokenId, blindedTransactions);
  return res.status(200).send({luckyTransaction});
});

function calculateBlindTransaction(session, R, a, b, transaction) {
  const keyPair = ed25519.keyFromSecret(distributionKeypair.rawSecretKey());
  const voterSession = new VoterSession(keyPair.public(), R, a, b);
  const challenge = voterSession.challenge(transaction);
  if (session.blindedTransaction !== challenge) {
    throw new Error(
      "blindedTransaction doesn't match calculated challenge, it looks like voter tried to cheat with this transaction",
    );
  }
}

function validateChallenge(updatedSession) {
  const { K, a, b, transaction } = updatedSession;
  if (!a) {
    throw new Error('updatedSession a is undefined');
  }
  if (!b) {
    throw new Error('updatedSession b is undefined');
  }
  if (!transaction) {
    throw new Error('updatedSession transaction is undefined');
  }
  calculateBlindTransaction(K, a, b, transaction);
}

function validateChallenges(tokenId, updatedSessions) {
  const userSessions = sessions[tokenId];
  userSessions.forEach(session => {
    const updatedSession = updatedSessions[session.id];
    validateSessions(session, updatedSession);
    if (!session.lucky) {
      validateChallenge(session, updatedSession);
    }
  });
}

app.post('/respondChallenge', async (req, res) => {
  const { tokenId, session, remake } = req.body;
  const luckyTransaction = validateChallenge(tokenId, session);
  return res.status(200).send(luckyTransaction);
});

app.post('/issueToken', async (req, res) => {
  const { accountId, userId } = req.body;
  log(`accountId: ${accountId} userId: ${userId}`);
  if (!accountId || !userId) {
    return res.sendStatus(400).end();
  }
  const isAlreadyIssued = await isAlreadyIssuedToUserId(userId);
  if (isAlreadyIssued) {
    return res.status(405).send('Token already issued');
  }
  try {
    const result = await sendTokenFromDistributionToAddress(accountId, userId);
    log({ hash: result.hash });
    return res.sendStatus(200).end();
  } catch (e) {
    log(e);
    return res.sendStatus(500).end();
  }
});

app.post('/signTx', async (req, res) => {
  const { txn, userId } = req.body;
  if (!txn) {
    log('txn must be provided');
    return res.status(400).send('txn must be provided');
  }
  if (!userId) {
    log('userId must be provided');
    return res.status(400).send('userId must be provided');
  }
  try {
    validateTransaction(txn, userId);
  } catch (e) {
    log(e);
    return res.status(400).send(e.message);
  }
  const isAlreadyIssued = await isAlreadyIssuedToUserId(userId);
  if (isAlreadyIssued) {
    log('isAlreadyIssued');
    return res.status(405).send('Token already issued');
  }
  try {
    const transaction = signTransaction(txn);
    const result = await stellar.submitTransaction(transaction);
    log({ hash: result.hash });
    return res.status(200).send(transaction.toXDR());
  } catch (e) {
    log(e);
    log(e.response.data);
    log({ result_codes: e.response.data.extras.result_codes });
    return res.sendStatus(500).end();
  }
});

// Mock of Authorization Provider
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.sendStatus(400).end();
  }
  return res
    .json({
      userId: crypto
        .createHmac('sha256', process.env.ISSUE_SECRET_KEY)
        .update(login)
        .digest('hex')
        .substring(0, 16),
    })
    .end();
});
