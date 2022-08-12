import { Router } from 'express';
import { quickSearchAPI, searchAnimesAPI } from '../../controllers/v2/search/api.js';
const router = Router();


router.get(`/`, searchAnimesAPI); // 搜索
router.get('/quick', quickSearchAPI) // 预搜索关键词显示

export default router;