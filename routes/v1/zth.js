import { Router } from 'express';
const router = Router();

import { runConmand } from '../../controllers/v1/zth/console.js';

router.post(`/console`, runConmand);

export default router;