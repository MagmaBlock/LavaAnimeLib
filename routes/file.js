const express = require('express');
const router = express.Router();

const file = require('../controllers/file');

router.get(`/url/*`, file.getFileUrl);

module.exports = router;