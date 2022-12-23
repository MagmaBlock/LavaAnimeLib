import { Router } from 'express';
import { loginRequire } from '../../controllers/v2/globalAuth/auth.js';
import { quickSearchAPI, searchAnimesAPI } from '../../controllers/v2/search/api.js';
import { getHotAnimesAPI } from '../../controllers/v2/search/getHotAnimesAPI.js';
const router = Router();

router.get('/hot', getHotAnimesAPI) // 最近热门

router.get(`/`, [loginRequire, searchAnimesAPI]); // 搜索
router.get('/quick', [loginRequire, quickSearchAPI]) // 预搜索关键词显示


export default router;