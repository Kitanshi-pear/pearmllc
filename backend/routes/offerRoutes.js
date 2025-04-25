// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const offerController = require('../controller/offerController');
const Offer = require('../models/Offer'); 


router.get('/', offerController.getAllOffers);
router.post('/', offerController.createOffer);

module.exports = router;
