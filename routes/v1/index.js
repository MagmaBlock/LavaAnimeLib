import { Router } from 'express';
const router = Router();

import { getYearList, getTypeList, getAllTypeList, getAnimeList } from '../../controllers/v1/index.js'; 

router.get(`/list/year/`, getYearList); // 获取年份列表
router.get(`/list/type/*`, getTypeList); // 获取类型列表
router.get(`/list/all/type`, getAllTypeList); // 获取所有类型列表
router.post(`/list/anime`, getAnimeList); // 获取番剧列表

export default router;