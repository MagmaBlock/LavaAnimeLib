const express = require('express');
const router = express.Router();

const getAnime = require('../controllers/anime/getAnime');
const getVideoList = require('../controllers/anime/getVideoList');
const getRelations = require('../controllers/anime/getRelations');

router.get(`/id/*`, getAnime.getAnimeById); // 根据 id 获取动画信息
router.post(`/id`, getAnime.getAnimesByIds); // 根据 id 获取动画信息，批量接口
router.get(`/bgm/*`, getAnime.getAnimeByBgmID); // 根据 bgmid 获取动画信息

router.get(`/list/*`, getVideoList.getVideoList); // 根据 id 获取某个番剧的文件列表

router.get(`/relations/*`, getRelations.getRelations); // 根据 id 获取番剧在 Bangumi 的关联作品信息

module.exports = router;