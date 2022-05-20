import { Router } from 'express';
const router = Router();

import { getAnimeById, getAnimesByIds, getAnimeByBgmID } from '../controllers/anime/getAnime.js';
import { getVideoList } from '../controllers/anime/getVideoList.js';
import { getRelations } from '../controllers/anime/getRelations.js';

router.get(`/id/*`, getAnimeById); // 根据 id 获取动画信息
router.post(`/id`, getAnimesByIds); // 根据 id 获取动画信息，批量接口
router.get(`/bgm/*`, getAnimeByBgmID); // 根据 bgmid 获取动画信息

router.get(`/list/*`, getVideoList); // 根据 id 获取某个番剧的文件列表

router.get(`/relations/*`, getRelations); // 根据 id 获取番剧在 Bangumi 的关联作品信息

export default router;