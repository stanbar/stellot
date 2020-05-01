import express from 'express';
import emails from './emails';

const router = express.Router();

router.use('/emails', emails);

export default router;
