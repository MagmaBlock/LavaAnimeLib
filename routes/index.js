const express = require('express');
const router = express.Router();

const index = require('../controllers/index');

router.get(`/list/year/`, index.getYearList);
router.get(`/list/month/*`, index.getMonthList);
router.get(`/list/all/month`, index.getAllMonthList);

module.exports = router;