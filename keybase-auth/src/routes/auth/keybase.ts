import express from 'express';
import createHttpError from 'http-errors';
import * as bot from '../../bot';
import * as auth from '../../auth';
import { verifyUserMembership } from '../../bot';

const router = express.Router();

router.post('/requestToken', async (req, res, next) => {
  const { username, requiredTeam } = req.body;
  try {
    if (!username) {
      throw new createHttpError.BadRequest('You need to specify username');
    }
    await verifyUserMembership(username, requiredTeam);
    const token = auth.createJwt(username, requiredTeam);
    await bot.sendToken(username, token);
    return res.sendStatus(200).end();
  } catch (e) {
    next(e)
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
