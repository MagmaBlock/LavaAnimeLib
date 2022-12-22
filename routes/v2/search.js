import { Router } from 'express';
import { quickSearchAPI, searchAnimesAPI } from '../../controllers/v2/search/api.js';
import { getHotAnimesAPI } from '../../controllers/v2/search/getHotAnimesAPI.js';
const router = Router();


router.get(`/`, searchAnimesAPI); // 搜索
router.get('/quick', quickSearchAPI) // 预搜索关键词显示

router.get('/hot', getHotAnimesAPI) // 最近热门

export default router;