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
    try {
      const token = auth.createJwt(email);

    try {
      await bot.sendEmail(email, token);
      } catch (e) {
        console.error("Failed sending email")
        throw e;
      }
      res.sendStatus(200).end();
    } catch (e) {
        console.error("Failed creating JWT token")
        throw e;
    }
  } catch (e) {
    console.error(e)
    next(e)
  }
});

export default router;
