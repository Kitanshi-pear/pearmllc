// routes/track.js
const express = require('express');
const router = express.Router();
const clickController = require('../controller/trackController');

router.post('/click', clickController.trackClick);
router.get('/view', clickController.trackView);

module.exports = router;
