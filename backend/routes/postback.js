// routes/postback.js
const express = require('express');
const router = express.Router();
const ConversionApiService = require('../services/ConversionApiService');

/**
 * Main postback endpoint for receiving conversions
 * Format: /postback?clickid={clickid}&payout={payout}
 */
router.get('/postback', async (req, res) => {
  await ConversionApiService.processPostback(req, res);
});

/**
 * Test a postback with a given click ID
 */
router.get('/test-postback/:clickId', async (req, res) => {
  try {
    const { clickId } = req.params;
    const { payout = '10.00' } = req.query;
    
    const result = await ConversionApiService.testPostback({
      clickId,
      payout,
      domain: req.get('host')
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate a postback URL for an offer source
 */
router.get('/generate-postback', (req, res) => {
  try {
    const { clickIdParam = 'clickid', includePayout = true } = req.query;
    
    const postbackUrl = ConversionApiService.generatePostbackUrl({
      domain: req.get('host'),
      clickIdParam,
      includePayout: includePayout === 'true'
    });
    
    res.json({
      success: true,
      postback_url: postbackUrl,
      example: postbackUrl
        .replace('{clickid}', 'abc123')
        .replace('{payout}', '10.00')
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Add a manual conversion
 */
router.post('/add-conversion', async (req, res) => {
  try {
    const { clickid, payout } = req.body;
    
    if (!clickid) {
      return res.status(400).json({
        success: false,
        error: 'Click ID is required'
      });
    }
    
    // Process as a normal postback with the provided data
    await ConversionApiService.processPostback({
      query: {
        clickid,
        payout: payout || '0',
        manual: true
      }
    }, res);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;