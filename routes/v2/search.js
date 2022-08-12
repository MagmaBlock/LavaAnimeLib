import { Router } from 'express';
import { searchAnimesAPI } from '../../controllers/v2/search/api.js';
const router = Router();


router.get(`/`, searchAnimesAPI); // 搜索

export default router;