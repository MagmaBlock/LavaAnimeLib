const express = require('express');
const router = express.Router();

const search = require('../controllers/search');

router.get(`/bgm/*`, search.searchByBgmId);
router.get(`/name/*`, search.searchByName);

module.exports = router;