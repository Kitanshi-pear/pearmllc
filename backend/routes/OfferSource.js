const express = require('express');
const router = express.Router();
const { OfferSource } = require('../models');

router.post('/create', async (req, res) => {
  try {
    const newSource = await OfferSource.create(req.body);

    res.status(201).json(newSource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const allSources = await OfferSource.findAll();
  res.json(allSources);
});

router.put("/update/:id", async (req, res) => {
    const { id } = req.params;
    const {
      name,
      alias,
      postback_url,
      currency,
      offer_url,
      clickid,
      sum,
      parameter,
      token,
      description,
      role,
    } = req.body;
  
    try {
      const offerSource = await OfferSource.findByPk(id);
      if (!offerSource) {
        return res.status(404).json({ error: "OfferSource not found" });
      }
  
      await offerSource.update({
        name,
        alias,
        postback_url,
        currency,
        offer_url,
        clickid,
        sum,
        parameter,
        token,
        description,
        role,
      });
  
      res.status(200).json({ message: "OfferSource updated successfully", offerSource });
    } catch (error) {
      console.error("Error updating offer source:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

router.get("/list", async (req, res) => {
    try {
      const offerSources = await OfferSource.findAll();
      res.json(offerSources);
    } catch (error) {
      console.error("Error fetching offer sources:", error.message);
      res.status(500).json({ message: "Failed to fetch offer sources" });
    }
  });

module.exports = router;
