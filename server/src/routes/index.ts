import express from 'express';
import api from './api';

const router = express.Router();

router.use('/api', api);

export default router;
