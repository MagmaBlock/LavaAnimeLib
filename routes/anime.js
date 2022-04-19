const express = require('express');
const router = express.Router();

const getAnime = require('../controllers/anime/getAnime'); 
const getVideoList = require('../controllers/anime/getVideoList');
const getRelations = require('../controllers/anime/getRelations');

router.get(`/id/*`, getAnime.getAnimeById); // 根据id获取动画信息
router.get(`/bgm/*`, getAnime.getAnimeByBgmID); // 根据bgmid获取动画信息
router.get(`/list/*`, getVideoList.getVideoList); // 根据id获取动画信息
router.get(`/relations/*`, getRelations.getRelations); // 根据id获取动画信息

module.exports = router;