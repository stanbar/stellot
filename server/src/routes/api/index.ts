import express from 'express';
import voting from './voting';
import session from './session';

const router = express.Router();

router.use('/voting', voting);
router.use('/session', session);

export default router;
