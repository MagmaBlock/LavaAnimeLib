import { Router } from 'express';
const router = Router();

import { getHeaderAPI, updateHeaderAPI } from '../../controllers/v2/home/headerAPI.js';

router.get(`/header/get`, getHeaderAPI);
router.post('/header/update', updateHeaderAPI);

export default router;