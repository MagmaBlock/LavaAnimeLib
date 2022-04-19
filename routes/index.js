const express = require('express');
const router = express.Router();

const index = require('../controllers/index'); 

router.get(`/list/year/`, index.getYearList);
router.get(`/list/type/*`, index.getTypeList);
router.get(`/list/all/type`, index.getAllTypeList);
router.post(`/list/anime`, index.getAnimeList);

module.exports = router;