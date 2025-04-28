// This is an example of how you might implement the server-side
// postback API endpoints in a Node.js/Express application

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../models'); // Your database models

/**
 * Endpoint for receiving postback notifications from traffic sources
 * This would be the endpoint you provide as your postback URL
 */
router.get('/conversions/postback', async (req, res) => {
  try {
    const {
      clickid,      // The unique ID of the click
      payout,       // The payout/revenue amount
      offerid,      // Your offer ID
      status,       // Conversion status (1 = approved, 0 = pending)
      campaignid,   // Campaign ID if applicable
      source,       // Traffic source
      ...otherParams // Any other custom parameters
    } = req.query;
    
    // Log the raw postback for debugging
    console.log('Received postback:', req.query);
    
    // 1. Required parameter validation
    if (!clickid) {
      console.error('Missing clickid in postback');
      // Return 200 OK even on error to prevent retries from traffic source
      return res.status(200).send('ERROR: Missing clickid');
    }
    
    // 2. Find the click record in your database
    const click = await db.Clicks.findOne({ 
      where: { external_id: clickid } 
    });
    
    if (!click) {
      console.error(`Click not found for clickid: ${clickid}`);
      return res.status(200).send('ERROR: Click not found');
    }
    
    // 3. Get the offer from the database
    let offerId = offerid || click.offer_id;
    
    const offer = await db.Offers.findOne({
      where: { id: offerId }
    });
    
    if (!offer) {
      console.error(`Offer not found: ${offerId}`);
      return res.status(200).send('ERROR: Offer not found');
    }
    
    // 4. Check if this conversion has already been processed (prevent duplicates)
    const existingConversion = await db.Conversions.findOne({
      where: { click_id: click.id }
    });
    
    if (existingConversion) {
      console.log(`Duplicate conversion for clickid: ${clickid}`);
      return res.status(200).send('Duplicate conversion');
    }
    
    // 5. Create the conversion record
    const conversion = await db.Conversions.create({
      id: uuidv4(),
      click_id: click.id,
      offer_id: offer.id,
      status: status === '1' ? 'approved' : 'pending',
      payout: parseFloat(payout) || offer.revenue,
      source: source || click.source,
      campaign_id: campaignid || click.campaign_id,
      ip_address: click.ip_address,
      country: click.country,
      metadata: JSON.stringify(otherParams),
      created_at: new Date()
    });
    
    // 6. Update offer metrics
    await db.Offers.update(
      { 
        conversion: db.sequelize.literal('conversion + 1'),
        total_revenue: db.sequelize.literal(`total_revenue + ${conversion.payout}`)
      },
      { where: { id: offer.id } }
    );
    
    // 7. Log the postback success
    await db.PostbackLogs.create({
      id: uuidv4(),
      conversion_id: conversion.id,
      click_id: click.id,
      offer_id: offer.id,
      status: 'success',
      request_data: JSON.stringify(req.query),
      created_at: new Date()
    });
    
    // 8. Return appropriate response based on the request
    if (req.headers.accept && req.headers.accept.includes('image')) {
      // If requesting an image, return a tracking pixel
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      // 1x1 transparent GIF
      const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return res.end(pixel);
    }
    
    // Return JSON response for S2S tracking
    return res.json({ 
      success: true, 
      message: 'Conversion recorded', 
      id: conversion.id 
    });
  } catch (error) {
    console.error('Postback processing error:', error);
    
    // Log the error
    try {
      await db.PostbackLogs.create({
        id: uuidv4(),
        status: 'error',
        request_data: JSON.stringify(req.query),
        error_message: error.message,
        created_at: new Date()
      });
    } catch (logError) {
      console.error('Failed to log postback error:', logError);
    }
    
    // Return 200 OK even on error to prevent retries
    return res.status(200).send('ERROR: ' + error.message);
  }
});

/**
 * Endpoint for manually sending postbacks
 * Can be used from admin panel to resend postbacks
 */
router.post('/postbacks/send', async (req, res) => {
  try {
    const { conversionId, clickId, customParams } = req.body;
    
    // Find the conversion
    let conversion;
    if (conversionId) {
      conversion = await db.Conversions.findOne({
        where: { id: conversionId },
        include: [
          { model: db.Clicks, as: 'click' },
          { model: db.Offers, as: 'offer' }
        ]
      });
    } else if (clickId) {
      conversion = await db.Conversions.findOne({
        where: { click_id: clickId },
        include: [
          { model: db.Clicks, as: 'click' },
          { model: db.Offers, as: 'offer' }
        ]
      });
    }
    
    if (!conversion) {
      return res.status(404).json({ error: 'Conversion not found' });
    }
    
    // Get the offer's postback URL template
    const postbackUrlTemplate = conversion.offer.postbackUrl;
    
    if (!postbackUrlTemplate) {
      return res.status(400).json({ error: 'No postback URL configured for this offer' });
    }
    
    // Prepare data for the postback
    const postbackData = {
      clickid: conversion.click.external_id,
      payout: conversion.payout.toString(),
      offerid: conversion.offer.id.toString(),
      status: conversion.status === 'approved' ? '1' : '0',
      campaignid: conversion.campaign_id,
      ...customParams
    };
    
    // Generate the actual postback URL by replacing macros
    let postbackUrl = postbackUrlTemplate;
    
    // Replace all macros with actual values
    Object.entries(postbackData).forEach(([key, value]) => {
      postbackUrl = postbackUrl.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value));
    });
    
    // Make the postback request
    const fetch = require('node-fetch');
    const postbackResponse = await fetch(postbackUrl, {
      method: 'GET',
      timeout: 10000
    });
    
    // Log the postback attempt
    await db.PostbackLogs.create({
      id: uuidv4(),
      conversion_id: conversion.id,
      click_id: conversion.click_id,
      offer_id: conversion.offer_id,
      status: postbackResponse.ok ? 'success' : 'error',
      request_data: JSON.stringify(postbackData),
      response_data: await postbackResponse.text(),
      response_code: postbackResponse.status,
      created_at: new Date()
    });
    
    return res.json({
      success: true,
      message: 'Postback sent successfully',
      url: postbackUrl,
      statusCode: postbackResponse.status
    });
  } catch (error) {
    console.error('Error sending postback:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint to get postback logs for a specific conversion or offer
 */
router.get('/postback-logs', async (req, res) => {
  try {
    const { conversion_id, offer_id, limit = 100 } = req.query;
    
    const where = {};
    if (conversion_id) where.conversion_id = conversion_id;
    if (offer_id) where.offer_id = offer_id;
    
    const logs = await db.PostbackLogs.findAll({
      where,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    });
    
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching postback logs:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint to generate a tracking pixel HTML for client-side postbacks
 */
router.get('/tracking-pixel', (req, res) => {
  const { clickid, offerid } = req.query;
  
  if (!clickid || !offerid) {
    return res.status(400).json({
      error: 'Missing required parameters: clickid, offerid'
    });
  }
  
  // Generate the pixel HTML
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const pixelUrl = `${baseUrl}/api/conversions/postback?clickid=${clickid}&offerid=${offerid}&status=1`;
  
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  
  res.json({
    html: pixelHtml,
    url: pixelUrl
  });
});

/**
 * Database models required for this implementation:
 *
 * - Clicks: Stores click data
 *   - id: Primary key
 *   - external_id: ID passed to traffic source
 *   - offer_id: Associated offer
 *   - campaign_id: Campaign that generated the click
 *   - source: Traffic source
 *   - ip_address: User's IP
 *   - country: User's country
 *   - ... other tracking data
 *
 * - Offers: Stores offer information
 *   - id: Primary key
 *   - name: Offer name
 *   - postbackUrl: Postback URL template
 *   - revenue: Default revenue/payout
 *   - ... other offer data
 *
 * - Conversions: Stores conversion data
 *   - id: Primary key
 *   - click_id: Associated click
 *   - offer_id: Associated offer
 *   - status: 'approved' or 'pending'
 *   - payout: Conversion payout amount
 *   - ... other conversion data
 *
 * - PostbackLogs: Stores postback attempt logs
 *   - id: Primary key
 *   - conversion_id: Associated conversion
 *   - click_id: Associated click
 *   - offer_id: Associated offer
 *   - status: 'success' or 'error'
 *   - request_data: Postback request data
 *   - response_data: Response from traffic source
 *   - response_code: HTTP response code
 *   - ... other log data
 */

module.exports = router;