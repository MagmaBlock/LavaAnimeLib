import { Router } from 'express';
const router = Router();

import { addView, getView } from '../controllers/view.js';

router.get(`/add/*`, addView); // 增加播放量
router.get(`/get/*`, getView); // 获取播放量

export default router;