const express = require('express');
const router = express.Router();

const index = require('../controllers/index'); 

router.get(`/list/year/`, index.getYearList); // 获取年份列表
router.get(`/list/type/*`, index.getTypeList); // 获取类型列表
router.get(`/list/all/type`, index.getAllTypeList); // 获取所有类型列表
router.post(`/list/anime`, index.getAnimeList); // 获取番剧列表

module.exports = router;