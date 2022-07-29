import { Router } from 'express';
const router = Router();

import { searchByBgmId, searchByName } from '../../controllers/v1/search.js';

router.get(`/bgm/*`, searchByBgmId); // 用 Bangumi ID 搜索
router.get(`/name/*`, searchByName); // 用名称搜索

export default router;