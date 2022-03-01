const express = require('express');
const router = express.Router();

const view = require('../controllers/view');

router.get(`/add/*`, view.addView);
router.get(`/get/*`, view.getView);

module.exports = router;