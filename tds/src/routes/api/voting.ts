import express from 'express';
import { createVoting } from '../../createVoting';
import { getPublicVotings, getVotingBySlug } from '../../database/database';

const router = express.Router();

const debug = require('debug')('blindsig');

router.get('/', async (req, res, next) => {
  try {
    const result = await getPublicVotings();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:slug', async (req, res, next) => {
  const { slug } = req.params;
  try {
    const result = await getVotingBySlug(slug);
    res.json(result);
  } catch (e) {
    next(e)
  }
});

router.post('/', async (req, res, next) => {
  const { createVotingRequest } = req.body;
  if (!createVotingRequest) {
    return res.sendStatus(400).end();
  }
  try {
    const createVotingResponse = await createVoting(createVotingRequest);
    debug('created Voting');
    return res.json(createVotingResponse).end();
  } catch (e) {
    next(e)
  }
});

export default router;
