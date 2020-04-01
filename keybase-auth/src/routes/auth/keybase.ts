import express, { Request } from 'express';
import createError from 'http-errors';
import * as bot from '../../bot';
import * as auth from '../../auth';
import { verifyUserMembership } from '../../bot';

const router = express.Router();

router.post('/sendToken', async (req, res, next) => {
  const { username, requiredTeam } = req.body;
  if (!username) {
    return res.status(400).send('You need to specify username').end();
  }
  try {
    const token = auth.createJwt(username);
    try {
      await verifyUserMembership(username, requiredTeam);
    } catch (e) {
      const error = new createError.Unauthorized(e.message);
      return res.status(error.statusCode).send(error.message);
    }
    await bot.sendCode(username, token);
    return res.sendStatus(200).end();
  } catch (e) {
    next(e)
  }
});

function getTokenFromHeader(req: Request) {
  if ((req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') ||
    (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

router.get('/getUsername', async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(400).send('please specify authorization token in header').end();
  }
  try {
    const username = auth.verifyAndDecodeJwt(token);
    return res.json({ username });
  } catch (e) {
    return next(e)
  }
});

router.post('/joinTeam', async (req, res, next) => {
  const { team } = req.body;
  if (!team) {
    return res.status(400).send('please specify team to join').end();
  }
  try {
    const result = await bot.joinTeam(team);
    console.log({ result });
    return res.status(200).send(result).end();
  } catch (e) {
    return next(e)
  }
});

export default router;
