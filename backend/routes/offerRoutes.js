// routes/offerRoutes.js
const express = require('express');
const router = express.Router();
const offerController = require('../controller/offerController');

// GET all offers - use the controller function
router.get('/', offerController.getAllOffers);

// POST to create a new offer - use the controller function
router.post('/', offerController.createOffer);

// Alternative routes for compatibility
router.get('/offers', offerController.getAllOffers);
router.post('/offers', offerController.createOffer);

module.exports = router;