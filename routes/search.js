const express = require('express');
const router = express.Router();

const search = require('../controllers/search');

router.get(`/bgm/*`, search.searchByBgmId); // 用 Bangumi ID 搜索
router.get(`/name/*`, search.searchByName); // 用名称搜索

module.exports = router;