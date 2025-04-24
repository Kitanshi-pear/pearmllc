// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const offerController = require('../controller/offerController');
const Offer = require('../models/Offer'); 

router.post('/offers', async (req, res) => {
    try {
        const { name, source, url, revenue, postbackUrl } = req.body;

        const newOffer = await Offer.create({ 
            name, source, url, revenue, postback_url: postbackUrl 
        });

        res.status(201).json(newOffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/', offerController.getAllOffers);
router.post('/', offerController.createOffer);

module.exports = router;
