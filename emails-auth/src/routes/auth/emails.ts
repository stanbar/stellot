import express from 'express';
import createHttpError from 'http-errors';
import * as bot from '../../mailer';
import * as auth from '../../auth';

const router = express.Router();

router.post('/requestToken', async (req, res, next) => {
  const { email } = req.body;
  try {
    if (!email) {
      throw new createHttpError.BadRequest('You need to specify email');
    }
    const token = auth.createJwt(email);
    await bot.sendEmail(email, token);
    return res.sendStatus(200).end();
  } catch (e) {
    next(e)
  }
});

export default router;
