const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/', async (req, res) => {
  const clicks = await db.Click.findAll({ include: [db.Cost, db.Revenue, db.Macro] });
  res.json(clicks);
});

router.post('/', async (req, res) => {
  const click = await db.Click.create(req.body);
  res.status(201).json(click);
});

module.exports = router;
