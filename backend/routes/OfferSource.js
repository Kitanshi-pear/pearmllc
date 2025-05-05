// routes/offer-sources.js (Updated with conversion API functionality)
const express = require('express');
const router = express.Router();
const { OfferSource } = require('../models');
const ConversionApiService = require('../services/ConversionApiService');

// EXISTING CODE - KEEP THIS
router.post('/create', async (req, res) => {
  try {
    // Add conversion API fields to the request body
    const offerSourceData = {
      ...req.body,
      forward_to_facebook: req.body.forward_to_facebook || false,
      forward_to_google: req.body.forward_to_google || false
    };
    
    const newSource = await OfferSource.create(offerSourceData);
    
    // Generate a default postback URL
    const postbackUrl = ConversionApiService.generatePostbackUrl({
      baseUrl: process.env.BACKEND_URL || 'https://pearmllc.onrender.com',
      clickIdParam: newSource.clickid || 'click_id',
      includePayout: true,
      includeStatus: true
    });
    
    res.status(201).json({
      ...newSource.toJSON(),
      postback_url: postbackUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXISTING CODE - KEEP THIS
router.get('/', async (req, res) => {
  const allSources = await OfferSource.findAll();
  res.json(allSources);
});

// EXISTING CODE - KEEP THIS BUT UPDATED
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
    // New fields for conversion API
    forward_to_facebook,
    forward_to_google
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
      // Include conversion API fields if provided
      ...(forward_to_facebook !== undefined && { forward_to_facebook }),
      ...(forward_to_google !== undefined && { forward_to_google })
    });
     
    res.status(200).json({ message: "OfferSource updated successfully", offerSource });
  } catch (error) {
    console.error("Error updating offer source:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// EXISTING CODE - KEEP THIS
router.get("/list", async (req, res) => {
  try {
    const offerSources = await OfferSource.findAll();
    res.json(offerSources);
  } catch (error) {
    console.error("Error fetching offer sources:", error.message);
    res.status(500).json({ message: "Failed to fetch offer sources" });
  }
});

// NEW ROUTES FOR CONVERSION API

/**
 * Generate a postback URL for an offer source
 */
router.get("/:id/postback-url", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the offer source
    const offerSource = await OfferSource.findByPk(id);
    if (!offerSource) {
      return res.status(404).json({ error: "OfferSource not found" });
    }
    
    // Get options from query parameters
    const options = {
      baseUrl: process.env.BACKEND_URL || 'https://pearmllc.onrender.com',
      clickIdParam: offerSource.clickid || req.query.clickid_param || 'click_id',
      includePayout: req.query.include_payout !== 'false',
      includeStatus: req.query.include_status !== 'false',
      includeRevenue: req.query.include_revenue === 'true'
    };
    
    // Generate the postback URL
    const postbackUrl = ConversionApiService.generatePostbackUrl(options);
    
    // Return the URL with examples
    res.json({
      id: offerSource.id,
      name: offerSource.name,
      postback_url: postbackUrl,
      example: postbackUrl
        .replace('{clickid}', 'abc123')
        .replace('{payout}', '10.00')
        .replace('{status}', 'approved')
        .replace('{revenue}', '12.50'),
      integration_steps: [
        "1. Copy this postback URL",
        "2. Add it to your affiliate network's postback settings",
        "3. Make sure to replace {clickid} with your network's click ID macro",
        "4. Test the integration using the test endpoint"
      ]
    });
  } catch (error) {
    console.error('❌ Error generating postback URL:', error);
    res.status(500).json({ error: 'Failed to generate postback URL' });
  }
});

/**
 * Update conversion settings for an offer source
 */
router.put("/:id/conversion-settings", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the offer source
    const offerSource = await OfferSource.findByPk(id);
    if (!offerSource) {
      return res.status(404).json({ error: "OfferSource not found" });
    }
    
    // Extract conversion settings
    const {
      forward_to_facebook,
      forward_to_google,
      facebook_event_name,
      google_conversion_id,
      google_conversion_label
    } = req.body;
    
    // Update the offer source
    await offerSource.update({
      ...(forward_to_facebook !== undefined && { forward_to_facebook }),
      ...(forward_to_google !== undefined && { forward_to_google }),
      ...(facebook_event_name !== undefined && { facebook_event_name }),
      ...(google_conversion_id !== undefined && { google_conversion_id }),
      ...(google_conversion_label !== undefined && { google_conversion_label })
    });
    
    res.json({
      message: "Conversion settings updated successfully",
      offerSource
    });
  } catch (error) {
    console.error('❌ Error updating conversion settings:', error);
    res.status(500).json({ error: 'Failed to update conversion settings' });
  }
});

/**
 * Test postback for an offer source
 */
router.get("/:id/test-postback", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the offer source
    const offerSource = await OfferSource.findByPk(id);
    if (!offerSource) {
      return res.status(404).json({ error: "OfferSource not found" });
    }
    
    // Create test parameters
    const testParams = {
      click_id: req.query.click_id || 'test_' + Date.now(),
      payout: req.query.payout || '10.00',
      status: req.query.status || 'approved'
    };
    
    // Return test info without actually processing
    res.json({
      success: true,
      message: 'Postback test parameters generated',
      offer_source: {
        id: offerSource.id,
        name: offerSource.name
      },
      test_params: testParams,
      test_url: `/api/postback/conversion?${new URLSearchParams(testParams).toString()}`,
      note: 'Use this URL to test your postback. No actual conversion will be recorded.'
    });
  } catch (error) {
    console.error('❌ Error generating test postback:', error);
    res.status(500).json({ error: 'Failed to generate test postback' });
  }
});

module.exports = router;