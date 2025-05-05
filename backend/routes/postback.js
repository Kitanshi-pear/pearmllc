// routes/postback.js
const express = require('express');
const router = express.Router();
const ConversionApiService = require('../services/ConversionApiService');
const { Click, Conversion, TrafficChannel, Campaign, OfferSource } = require('../models');

/**
 * Main postback endpoint for conversions
 * This handles incoming conversion notifications from offer sources
 */
router.get('/conversion', async (req, res) => {
  try {
    console.log('📣 Postback received:', req.query);
    
    // Process the conversion through our service
    const result = await ConversionApiService.processConversion(req.query);
    
    // Return success response
    // Always return 200 even if there are internal errors to prevent retries from offer sources
    res.status(200).json({
      success: true,
      conversion_id: result.conversion_id
    });
  } catch (error) {
    console.error('❌ Postback error:', error);
    
    // Still return 200 to prevent retries, but indicate there was an error
    res.status(200).json({
      success: false,
      error: 'Internal processing error',
      message: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

/**
 * Facebook-specific postback endpoint
 */
router.get('/facebook', (req, res) => {
  // Add Facebook-specific parameters
  req.query.platform = 'facebook';
  req.query.event_name = req.query.event_name || 'Purchase';
  
  // Forward to the main conversion endpoint
  req.url = '/conversion?' + new URLSearchParams(req.query).toString();
  router.handle(req, res);
});

/**
 * Google-specific postback endpoint
 */
router.get('/google', (req, res) => {
  // Add Google-specific parameters
  req.query.platform = 'google';
  req.query.event_name = req.query.event_name || 'conversion';
  
  // Forward to the main conversion endpoint
  req.url = '/conversion?' + new URLSearchParams(req.query).toString();
  router.handle(req, res);
});

/**
 * Generate a postback URL for an offer source
 */
router.get('/generate/:offerSourceId', async (req, res) => {
  try {
    const { offerSourceId } = req.params;
    
    // Check if offer source exists
    const offerSource = await OfferSource.findByPk(offerSourceId);
    if (!offerSource) {
      return res.status(404).json({ error: 'Offer source not found' });
    }
    
    // Get postback options from query parameters
    const options = {
      baseUrl: process.env.BACKEND_URL || 'https://pearmllc.onrender.com',
      clickIdParam: req.query.clickid_param || offerSource.clickid || 'click_id',
      includePayout: req.query.include_payout !== 'false',
      includeStatus: req.query.include_status !== 'false',
      includeRevenue: req.query.include_revenue === 'true',
      customParams: []
    };
    
    // Add custom parameters if provided
    if (req.query.custom_params) {
      try {
        options.customParams = JSON.parse(req.query.custom_params);
      } catch (e) {
        console.warn('Invalid custom_params JSON:', e);
      }
    }
    
    // Generate the postback URL
    const postbackUrl = ConversionApiService.generatePostbackUrl(options);
    
    // Return the generated URL
    res.json({
      offer_source_id: offerSourceId,
      offer_source_name: offerSource.name,
      postback_url: postbackUrl,
      example: postbackUrl
        .replace('{clickid}', 'abc123')
        .replace('{payout}', '10.00')
        .replace('{status}', 'approved')
        .replace('{revenue}', '12.50')
    });
  } catch (error) {
    console.error('❌ Error generating postback URL:', error);
    res.status(500).json({ error: 'Failed to generate postback URL' });
  }
});

/**
 * Check the status of a conversion for a click
 */
router.get('/status/:clickId', async (req, res) => {
  try {
    const { clickId } = req.params;
    
    // Find conversions for this click
    const conversions = await Conversion.findAll({
      where: { click_id: clickId },
      order: [['createdAt', 'DESC']]
    });
    
    if (conversions.length === 0) {
      return res.json({
        click_id: clickId,
        has_conversion: false,
        conversions: []
      });
    }
    
    // Return conversion data
    res.json({
      click_id: clickId,
      has_conversion: true,
      conversions: conversions.map(conv => ({
        id: conv.id,
        status: conv.status,
        event_name: conv.event_name,
        payout: conv.payout,
        revenue: conv.revenue,
        created_at: conv.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Error checking conversion status:', error);
    res.status(500).json({ error: 'Failed to check conversion status' });
  }
});

/**
 * Test endpoint to validate postback functionality
 */
router.get('/test', (req, res) => {
  console.log('🧪 Postback test requested');
  
  // Return the query parameters for testing
  res.json({
    success: true,
    message: 'Postback route is working properly',
    received_params: req.query
  });
});

module.exports = router;