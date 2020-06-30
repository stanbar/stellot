import express from 'express';
import voting from './voting';
import blindsig from './blindsig';
import castVote from './castVote';

const router = express.Router();

router.use('/voting', voting);
router.use('/blindsig', blindsig);
router.use('/castVote', castVote);

export default router;
