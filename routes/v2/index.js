import { Router } from 'express';
const router = Router();

import {  } from '../../controllers/v1/index.js';

router.get(`/list/year/`, getYearList); // 获取年份列表

export default router;