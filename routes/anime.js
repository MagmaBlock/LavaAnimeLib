import { Router } from 'express';
const router = Router();

import { getAnimeById, getAnimesByIds, getAnimeByBgmID } from '../controllers/anime/getAnime.js';
import { getVideoList } from '../controllers/anime/getVideoList.js';
import { getBangumiRelations } from '../controllers/anime/bangumi/getRelations.js';

import { getBangumiSubjects } from '../controllers/anime/bangumi/getBangumiSubject.js';

// 番剧库动画信息相关 API
router.get(`/id/*`, getAnimeById); // 根据 id 获取动画信息
router.post(`/id`, getAnimesByIds); // 根据 id 获取动画信息，批量接口
router.get(`/bgm/*`, getAnimeByBgmID); // 根据 bgmid 获取动画信息
// 获取资源类
router.get(`/list/*`, getVideoList); // 根据 id 获取某个番剧的文件列表

// 番剧库自建 Bangumi 加速本地化接口
router.get(`/relations/*`, getBangumiRelations); // 根据 id 获取番剧在 Bangumi 的关联作品信息
router.get(`/bangumi/subjects/*`, getBangumiSubjects); // 根据 bgmid 获取 Bangumi 的番剧信息，相当于 CDN

export default router;