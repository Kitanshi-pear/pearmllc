// routes/lp.js
const express = require('express');
const router = express.Router();
const { LpViews, lpclicks } = require('../models');

// LP View
router.post('/view', async (req, res) => {
  try {
    await LpViews.create(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error saving LP view:', err);
    res.sendStatus(500);
  }
});

// LP Click
router.post('/click', async (req, res) => {
  try {
    await lpclicks.create(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error saving LP click:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
