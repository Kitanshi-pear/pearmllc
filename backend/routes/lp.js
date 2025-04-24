const express = require('express');
const router = express.Router();
const { LpViews, lpclicks } = require('../models');

// LP View Tracking
router.get('/view', async (req, res) => {
  const { click_id, referrer } = req.query;

  if (!click_id) {
    console.log('[LP VIEW] Missing click_id in request:', req.query);
    return res.status(400).json({ error: 'Missing click_id' });
  }

  console.log('[LP VIEW] Logging view:', { click_id, referrer });

  await LpViews.create({ click_id, referrer, timestamp: new Date() });

  console.log('[LP VIEW] View logged successfully');
  res.sendStatus(200);
});

// LP Click Tracking
router.get('/lpclick', async (req, res) => {
  const { click_id } = req.query;

  if (!click_id) {
    console.log('[LP CLICK] Missing click_id in request:', req.query);
    return res.status(400).json({ error: 'Missing click_id' });
  }

  console.log('[LP CLICK] Logging click:', { click_id });

  await lpclicks.create({ click_id, timestamp: new Date() });

  console.log('[LP CLICK] Click logged successfully');
  res.sendStatus(200);
});

module.exports = router;
