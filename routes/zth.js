const express = require('express');
const router = express.Router();

const runConmand = require('../controllers/zth/console');

router.post(`/console`, runConmand.runConmand);

module.exports = router;