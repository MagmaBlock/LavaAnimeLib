import { Router } from 'express';
const router = Router();

import getIndexInfo from '../../controllers/v2/index/info.js';
import queryAnimeByIndex from '../../controllers/v2/index/query.js';

router.get(`/info`, getIndexInfo); // 获取全部索引信息
router.post('/query', queryAnimeByIndex) // 根据索引查询番剧

export default router;