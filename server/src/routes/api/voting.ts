import express from 'express';
import mongoose from 'mongoose';
import { createVoting } from '../../createVoting';

const router = express.Router();
const Voting = mongoose.model('Voting');

router.get('/', async (req, res) => {
  const result = await Voting.find({});
  res.json(result);
});

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const result = await Voting.find({ slug });
  res.json(result);
});

router.post('/', async (req, res) => {
  const { createVotingRequest } = req.body;
  if (!createVotingRequest) {
    return res.sendStatus(400).end();
  }
  try {
    const createVotingResponse = await createVoting(createVotingRequest);
    return res.json(createVotingResponse).end();
  } catch (e) {
    console.error(e.response.data.extras);
    return res.status(500).end();
  }
});

export default router;
