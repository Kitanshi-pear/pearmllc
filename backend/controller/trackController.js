const db = require('../models');
const macroService = require('../services/MacroServices');
const metricsService = require('../routes/metrics');
const axios = require('axios');

class TrackingController {
  /**
   * Handle incoming clicks and redirect to appropriate destination
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async handleClick(req, res) {
    try {
      const query = req.query;
      const { unique_id, tc: traffic_channel_id } = query;
      
      if (!unique_id || !traffic_channel_id) {
        return res.status(400).send('Invalid tracking link');
      }
      
      // Get campaign with relationships
      const campaign = await db.Campaign.findByPk(unique_id, {
        include: [
          { model: db.TrafficChannel },
          { model: db.Lander },
          { model: db.Offer }
        ]
      });
      
      if (!campaign || !campaign.is_active) {
        return res.status(404).send('Campaign not found or inactive');
      }
      
      // Extract user information from request
      const userAgent = req.headers['user-agent'];
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const referer = req.headers.referer || '';
      
      // Create click record
      const click = await db.Click.create({
        uuid: require('uuid').v4(),
        ip,
        user_agent: userAgent,
        referer,
        unique_id: campaign.id,
        traffic_channel_id: campaign.traffic_channel_id,
        lander_id: campaign.lander_id,
        offer_id: campaign.offer_id,
        // Other fields will be populated later or during conversion
      });
      
      // Parse and store macros from query parameters
      const macro = await macroService.parseAndStoreMacros(
        query, 
        traffic_channel_id, 
        unique_id
      );
      
      // Associate macro with click
      await macroService.associateWithClick(macro.id, click.id);
      
      // Increment metrics for this click
      await metricsService.incrementClickMetrics(
        unique_id, 
        traffic_channel_id,
        campaign.lander_id,
        campaign.offer_id
      );
      
      // Determine redirect destination
      let redirectUrl;
      
      // If campaign has a lander, redirect to lander first
      if (campaign.Lander && campaign.direct_linking === false) {
        // Get lander URL and replace macros with values
        redirectUrl = campaign.Lander.url;
        
        // Add necessary parameters to track this click
        const landerUrl = new URL(redirectUrl);
        landerUrl.searchParams.append('click_id', click.id);
        
        // Add other sub parameters
        for (let i = 1; i <= 23; i++) {
          const subKey = `sub${i}`;
          if (macro[subKey]) {
            landerUrl.searchParams.append(subKey, macro[subKey]);
          }
        }
        
        redirectUrl = landerUrl.toString();
      } else {
        // Direct linking - redirect straight to offer URL
        if (campaign.Offer) {
          redirectUrl = campaign.Offer.tracking_url;
          
          // Replace macros in offer URL
          const macroValues = {
            click_id: click.id.toString(),
            unique_id: campaign.id.toString()
          };
          
          // Add sub values from the macro
          for (let i = 1; i <= 23; i++) {
            const subKey = `sub${i}`;
            if (macro[subKey]) {
              macroValues[subKey] = macro[subKey];
            }
          }
          
          redirectUrl = macroService.replaceMacros(redirectUrl, macroValues);
        } else {
          return res.status(404).send('No valid redirect destination found');
        }
      }
      
      // Redirect the user
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error handling click:', error);
      return res.status(500).send('Error processing your request');
    }
  }

  /**
   * Handle landing page view
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async handleLanderView(req, res) {
    try {
      const { click_id } = req.query;
      
      if (!click_id) {
        return res.status(400).json({
          success: false,
          message: 'Click ID is required'
        });
      }
      
      // Update click record to mark lander as viewed
      const click = await db.Click.findByPk(click_id);
      
      if (!click) {
        return res.status(404).json({
          success: false,
          message: 'Click not found'
        });
      }
      
      click.landing_page_viewed = true;
      await click.save();
      
      // Increment lander view metrics
      if (click.unique_id && click.lander_id) {
        await metricsService.incrementLanderViewMetrics(
          click.unique_id,
          click.traffic_channel_id,
          click.lander_id
        );
      }
      
      return res.status(200).json({
        success: true,
        message: 'Landing page view recorded'
      });
    } catch (error) {
      console.error('Error handling lander view:', error);
      return res.status(500).json({
        success: false,
        message: 'Error recording landing page view',
        error: error.message
      });
    }
  }

  /**
   * Handle conversion tracking
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async trackConversion(req, res) {
    try {
      const { click_id, payout, offer_id } = req.query;
      
      if (!click_id) {
        return res.status(400).json({
          success: false,
          message: 'Click ID is required'
        });
      }
      
      // Find the click
      const click = await db.Click.findByPk(click_id, {
        include: [
          { model: db.Campaign },
          { model: db.TrafficChannel },
          { model: db.Offer }
        ]
      });
      
      if (!click) {
        return res.status(404).json({
          success: false,
          message: 'Click not found'
        });
      }
      
      // Verify offer ID if provided
      if (offer_id && click.offer_id !== parseInt(offer_id)) {
        return res.status(400).json({
          success: false,
          message: 'Offer ID mismatch'
        });
      }
      
      // Update click record with conversion information
      click.conversion = true;
      click.conversion_time = new Date();
      
      // Set revenue
      let revenue = 0;
      if (payout) {
        revenue = parseFloat(payout);
      } else if (click.Offer && click.Offer.payout) {
        revenue = click.Offer.payout;
      }
      
      click.revenue = revenue;
      
      // Calculate profit (revenue - cost)
      click.profit = revenue - click.cost;
      
      await click.save();
      
      // Update metrics for this conversion
      await metricsService.incrementConversionMetrics(
        click.unique_id,
        click.traffic_channel_id,
        click.lander_id,
        click.offer_id,
        revenue,
        click.cost
      );
      
      // Generate and send postback if the traffic channel has a postback URL
      if (click.TrafficChannel && click.TrafficChannel.postback_url) {
        try {
          const postbackUrl = await macroService.generatePostbackUrl(click_id, revenue);
          
          // Send the postback asynchronously
          axios.get(postbackUrl).catch(err => {
            console.error('Error sending postback:', err);
          });
        } catch (postbackError) {
          console.error('Error generating postback URL:', postbackError);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Conversion tracked successfully'
      });
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return res.status(500).json({
        success: false,
        message: 'Error tracking conversion',
        error: error.message
      });
    }
  }
}

module.exports = new TrackingController();