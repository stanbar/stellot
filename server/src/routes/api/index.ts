import express from 'express';
import voting from './voting';
import blindsig from './blindsig';

const router = express.Router();

router.use('/voting', voting);
router.use('/blindsig', blindsig);

export default router;
