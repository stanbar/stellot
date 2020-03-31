import express from 'express';
import keybase from './keybase';

const router = express.Router();

router.use('/keybase', keybase);

export default router;
