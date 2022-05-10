const express = require('express');
const router = express.Router();

const view = require('../controllers/view');

router.get(`/add/*`, view.addView); // 增加播放量
router.get(`/get/*`, view.getView); // 获取播放量

module.exports = router;