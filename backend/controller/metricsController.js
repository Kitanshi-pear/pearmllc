// controllers/metricsController.js
const metricsService = require('../services/metricsService');
const db = require('../models');

class MetricsController {
  /**
   * Get metrics for a campaign
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getCampaignMetrics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, dimension } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      const end = endDate ? new Date(endDate) : new Date(); // Default to today
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Convert dates to YYYY-MM-DD format for SQL queries
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];
      
      // Check if campaign exists
      const campaign = await db.Campaign.findByPk(id);
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }
      
      // Get aggregated metrics
      const aggregatedMetrics = await metricsService.getAggregatedMetrics('campaign', id, formattedStart, formattedEnd);
      
      let breakdownMetrics = [];
      if (dimension) {
        // Get metrics breakdown by dimension
        breakdownMetrics = await metricsService.getMetricsByDimension('campaign', id, dimension, formattedStart, formattedEnd);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          campaign: {
            id: campaign.id,
            name: campaign.name
          },
          dateRange: {
            startDate: formattedStart,
            endDate: formattedEnd
          },
          summary: aggregatedMetrics,
          breakdown: dimension ? {
            dimension,
            data: breakdownMetrics
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting campaign metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get campaign metrics',
        error: error.message
      });
    }
  }

  /**
   * Get metrics for a traffic channel
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getTrafficChannelMetrics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, dimension } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Convert dates to YYYY-MM-DD format
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];
      
      // Check if traffic channel exists
      const trafficChannel = await db.TrafficChannel.findByPk(id);
      if (!trafficChannel) {
        return res.status(404).json({
          success: false,
          message: 'Traffic channel not found'
        });
      }
      
      // Get aggregated metrics
      const aggregatedMetrics = await metricsService.getAggregatedMetrics('traffic_channel', id, formattedStart, formattedEnd);
      
      let breakdownMetrics = [];
      if (dimension) {
        // Get metrics breakdown by dimension
        breakdownMetrics = await metricsService.getMetricsByDimension('traffic_channel', id, dimension, formattedStart, formattedEnd);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          trafficChannel: {
            id: trafficChannel.id,
            name: trafficChannel.name,
            type: trafficChannel.type
          },
          dateRange: {
            startDate: formattedStart,
            endDate: formattedEnd
          },
          summary: aggregatedMetrics,
          breakdown: dimension ? {
            dimension,
            data: breakdownMetrics
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting traffic channel metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get traffic channel metrics',
        error: error.message
      });
    }
  }

  /**
   * Get metrics for a lander
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getLanderMetrics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, dimension } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Convert dates to YYYY-MM-DD format
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];
      
      // Check if lander exists
      const lander = await db.Lander.findByPk(id);
      if (!lander) {
        return res.status(404).json({
          success: false,
          message: 'Landing page not found'
        });
      }
      
      // Get aggregated metrics
      const aggregatedMetrics = await metricsService.getAggregatedMetrics('lander', id, formattedStart, formattedEnd);
      
      let breakdownMetrics = [];
      if (dimension) {
        // Get metrics breakdown by dimension
        breakdownMetrics = await metricsService.getMetricsByDimension('lander', id, dimension, formattedStart, formattedEnd);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          lander: {
            id: lander.id,
            name: lander.name,
            url: lander.url
          },
          dateRange: {
            startDate: formattedStart,
            endDate: formattedEnd
          },
          summary: aggregatedMetrics,
          breakdown: dimension ? {
            dimension,
            data: breakdownMetrics
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting lander metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get lander metrics',
        error: error.message
      });
    }
  }

  /**
   * Get metrics for an offer
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getOfferMetrics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, dimension } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Convert dates to YYYY-MM-DD format
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];
      
      // Check if offer exists
      const offer = await db.Offer.findByPk(id);
      if (!offer) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found'
        });
      }
      
      // Get aggregated metrics
      const aggregatedMetrics = await metricsService.getAggregatedMetrics('offer', id, formattedStart, formattedEnd);
      
      let breakdownMetrics = [];
      if (dimension) {
        // Get metrics breakdown by dimension
        breakdownMetrics = await metricsService.getMetricsByDimension('offer', id, dimension, formattedStart, formattedEnd);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          offer: {
            id: offer.id,
            name: offer.name,
            payout: offer.payout
          },
          dateRange: {
            startDate: formattedStart,
            endDate: formattedEnd
          },
          summary: aggregatedMetrics,
          breakdown: dimension ? {
            dimension,
            data: breakdownMetrics
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting offer metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get offer metrics',
        error: error.message
      });
    }
  }

  /**
   * Get metrics for an offer source
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getOfferSourceMetrics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, dimension } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Convert dates to YYYY-MM-DD format
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];
      
      // Check if offer source exists
      const offerSource = await db.OfferSource.findByPk(id);
      if (!offerSource) {
        return res.status(404).json({
          success: false,
          message: 'Offer source not found'
        });
      }
      
      // Get aggregated metrics
      const aggregatedMetrics = await metricsService.getAggregatedMetrics('offer_source', id, formattedStart, formattedEnd);
      
      let breakdownMetrics = [];
      if (dimension) {
        // Get metrics breakdown by dimension
        breakdownMetrics = await metricsService.getMetricsByDimension('offer_source', id, dimension, formattedStart, formattedEnd);
      }
      
      return res.status(200).json({
        success: true,
        data: {
          offerSource: {
            id: offerSource.id,
            name: offerSource.name
          },
          dateRange: {
            startDate: formattedStart,
            endDate: formattedEnd
          },
          summary: aggregatedMetrics,
          breakdown: dimension ? {
            dimension,
            data: breakdownMetrics
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting offer source metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get offer source metrics',
        error: error.message
      });
    }
  }
  
  /**
   * Get global metrics across all entities
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getGlobalMetrics(req, res) {
    try {
      const { startDate, endDate, dimension } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Convert dates to YYYY-MM-DD format
      const formattedStart = start.toISOString().split('T')[0];
      const formattedEnd = end.toISOString().split('T')[0];
      
      // Get aggregated metrics across all entities
      const metrics = await db.Metrics.findAll({
        where: {
          date: {
            [db.Sequelize.Op.between]: [formattedStart, formattedEnd]
          }
        },
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
          [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
          [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
        ],
        raw: true
      });
      
      // Calculate derived metrics
      const aggregatedMetrics = metrics[0] || {};
      const impressions = parseInt(aggregatedMetrics.impressions) || 0;
      const clicks = parseInt(aggregatedMetrics.clicks) || 0;
      const lpviews = parseInt(aggregatedMetrics.lpviews) || 0;
      const conversions = parseInt(aggregatedMetrics.conversions) || 0;
      const revenue = parseFloat(aggregatedMetrics.revenue) || 0;
      const cost = parseFloat(aggregatedMetrics.cost) || 0;
      const profit = parseFloat(aggregatedMetrics.profit) || 0;
      
      const summary = {
        impressions,
        clicks,
        lpviews,
        conversions,
        revenue,
        cost,
        profit,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cr: clicks > 0 ? (conversions / clicks) * 100 : 0,
        offer_cr: lpviews > 0 ? (conversions / lpviews) * 100 : 0,
        cpc: clicks > 0 ? cost / clicks : 0,
        cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
        roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
        epc: clicks > 0 ? revenue / clicks : 0,
        lpepc: lpviews > 0 ? revenue / lpviews : 0
      };
      
      let breakdownMetrics = [];
      if (dimension) {
        // Handle different dimension breakdowns
        if (dimension === 'campaign') {
          breakdownMetrics = await this.getMetricsBreakdownByCampaign(formattedStart, formattedEnd);
        } else if (dimension === 'traffic_channel') {
          breakdownMetrics = await this.getMetricsBreakdownByTrafficChannel(formattedStart, formattedEnd);
        } else if (dimension === 'lander') {
          breakdownMetrics = await this.getMetricsBreakdownByLander(formattedStart, formattedEnd);
        } else if (dimension === 'offer') {
          breakdownMetrics = await this.getMetricsBreakdownByOffer(formattedStart, formattedEnd);
        } else if (dimension === 'day' || dimension === 'hour' || dimension === 'country') {
          // For time-based dimensions, we need to aggregate all metrics
          breakdownMetrics = await db.sequelize.query(`
            SELECT 
              ${dimension === 'day' ? 'date' : dimension === 'hour' ? 'CONCAT(date, " ", hour, ":00") as dimension' : 'dimension'},
              SUM(impressions) as impressions,
              SUM(clicks) as clicks,
              SUM(lpviews) as lpviews,
              SUM(conversions) as conversions,
              SUM(total_revenue) as revenue,
              SUM(total_cost) as cost,
              SUM(profit) as profit
            FROM Metrics
            WHERE date BETWEEN :startDate AND :endDate
            GROUP BY ${dimension === 'day' ? 'date' : dimension === 'hour' ? 'date, hour' : 'dimension'}
            ORDER BY ${dimension === 'day' ? 'date' : dimension === 'hour' ? 'date, hour' : 'dimension'}
          `, {
            replacements: { startDate: formattedStart, endDate: formattedEnd },
            type: db.sequelize.QueryTypes.SELECT
          });
          
          // Calculate derived metrics for each row
          breakdownMetrics = breakdownMetrics.map(record => {
            const impressions = parseInt(record.impressions) || 0;
            const clicks = parseInt(record.clicks) || 0;
            const lpviews = parseInt(record.lpviews) || 0;
            const conversions = parseInt(record.conversions) || 0;
            const revenue = parseFloat(record.revenue) || 0;
            const cost = parseFloat(record.cost) || 0;
            const profit = parseFloat(record.profit) || 0;
            
            return {
              dimension: record.dimension || (dimension === 'day' ? record.date : 'Unknown'),
              impressions,
              clicks,
              lpviews,
              conversions,
              revenue,
              cost,
              profit,
              ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
              cr: clicks > 0 ? (conversions / clicks) * 100 : 0,
              offer_cr: lpviews > 0 ? (conversions / lpviews) * 100 : 0,
              cpc: clicks > 0 ? cost / clicks : 0,
              cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
              roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
              epc: clicks > 0 ? revenue / clicks : 0,
              lpepc: lpviews > 0 ? revenue / lpviews : 0
            };
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          dateRange: {
            startDate: formattedStart,
            endDate: formattedEnd
          },
          summary,
          breakdown: dimension ? {
            dimension,
            data: breakdownMetrics
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting global metrics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get global metrics',
        error: error.message
      });
    }
  }
  
  /**
   * Helper method to get metrics breakdown by campaign
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Array} - Metrics broken down by campaign
   */
  async getMetricsBreakdownByCampaign(startDate, endDate) {
    try {
      const metrics = await db.Metrics.findAll({
        where: {
          date: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          },
          campaign_id: {
            [db.Sequelize.Op.not]: null
          }
        },
        attributes: [
          'campaign_id',
          [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
          [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
          [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
        ],
        include: [
          {
            model: db.Campaign,
            attributes: ['name']
          }
        ],
        group: ['campaign_id'],
        raw: true
      });
      
      // Calculate derived metrics for each campaign
      return metrics.map(record => {
        const impressions = parseInt(record.impressions) || 0;
        const clicks = parseInt(record.clicks) || 0;
        const lpviews = parseInt(record.lpviews) || 0;
        const conversions = parseInt(record.conversions) || 0;
        const revenue = parseFloat(record.revenue) || 0;
        const cost = parseFloat(record.cost) || 0;
        const profit = parseFloat(record.profit) || 0;
        
        return {
          dimension: record['Campaign.name'] || `Campaign ${record.campaign_id}`,
          id: record.campaign_id,
          impressions,
          clicks,
          lpviews,
          conversions,
          revenue,
          cost,
          profit,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cr: clicks > 0 ? (conversions / clicks) * 100 : 0,
          offer_cr: lpviews > 0 ? (conversions / lpviews) * 100 : 0,
          cpc: clicks > 0 ? cost / clicks : 0,
          cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
          roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
          epc: clicks > 0 ? revenue / clicks : 0,
          lpepc: lpviews > 0 ? revenue / lpviews : 0
        };
      });
    } catch (error) {
      console.error('Error getting metrics by campaign:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to get metrics breakdown by traffic channel
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Array} - Metrics broken down by traffic channel
   */
  async getMetricsBreakdownByTrafficChannel(startDate, endDate) {
    try {
      const metrics = await db.Metrics.findAll({
        where: {
          date: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          },
          traffic_channel_id: {
            [db.Sequelize.Op.not]: null
          }
        },
        attributes: [
          'traffic_channel_id',
          [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
          [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
          [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
        ],
        include: [
          {
            model: db.TrafficChannel,
            attributes: ['name', 'type']
          }
        ],
        group: ['traffic_channel_id'],
        raw: true
      });
      
      // Calculate derived metrics for each traffic channel
      return metrics.map(record => {
        const impressions = parseInt(record.impressions) || 0;
        const clicks = parseInt(record.clicks) || 0;
        const lpviews = parseInt(record.lpviews) || 0;
        const conversions = parseInt(record.conversions) || 0;
        const revenue = parseFloat(record.revenue) || 0;
        const cost = parseFloat(record.cost) || 0;
        const profit = parseFloat(record.profit) || 0;
        
        return {
          dimension: record['TrafficChannel.name'] || `Traffic Channel ${record.traffic_channel_id}`,
          id: record.traffic_channel_id,
          type: record['TrafficChannel.type'] || 'unknown',
          impressions,
          clicks,
          lpviews,
          conversions,
          revenue,
          cost,
          profit,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cr: clicks > 0 ? (conversions / clicks) * 100 : 0,
          offer_cr: lpviews > 0 ? (conversions / lpviews) * 100 : 0,
          cpc: clicks > 0 ? cost / clicks : 0,
          cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
          roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
          epc: clicks > 0 ? revenue / clicks : 0,
          lpepc: lpviews > 0 ? revenue / lpviews : 0
        };
      });
    } catch (error) {
      console.error('Error getting metrics by traffic channel:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to get metrics breakdown by lander
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Array} - Metrics broken down by lander
   */
  async getMetricsBreakdownByLander(startDate, endDate) {
    try {
      const metrics = await db.Metrics.findAll({
        where: {
          date: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          },
          lander_id: {
            [db.Sequelize.Op.not]: null
          }
        },
        attributes: [
          'lander_id',
          [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
          [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
          [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
        ],
        include: [
          {
            model: db.Lander,
            attributes: ['name']
          }
        ],
        group: ['lander_id'],
        raw: true
      });
      
      // Calculate derived metrics for each lander
      return metrics.map(record => {
        const impressions = parseInt(record.impressions) || 0;
        const clicks = parseInt(record.clicks) || 0;
        const lpviews = parseInt(record.lpviews) || 0;
        const conversions = parseInt(record.conversions) || 0;
        const revenue = parseFloat(record.revenue) || 0;
        const cost = parseFloat(record.cost) || 0;
        const profit = parseFloat(record.profit) || 0;
        
        return {
          dimension: record['Lander.name'] || `Lander ${record.lander_id}`,
          id: record.lander_id,
          impressions,
          clicks,
          lpviews,
          conversions,
          revenue,
          cost,
          profit,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cr: clicks > 0 ? (conversions / clicks) * 100 : 0,
          offer_cr: lpviews > 0 ? (conversions / lpviews) * 100 : 0,
          cpc: clicks > 0 ? cost / clicks : 0,
          cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
          roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
          epc: clicks > 0 ? revenue / clicks : 0,
          lpepc: lpviews > 0 ? revenue / lpviews : 0
        };
      });
    } catch (error) {
      console.error('Error getting metrics by lander:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to get metrics breakdown by offer
   * @param {String} startDate - Start date (YYYY-MM-DD)
   * @param {String} endDate - End date (YYYY-MM-DD)
   * @returns {Array} - Metrics broken down by offer
   */
  async getMetricsBreakdownByOffer(startDate, endDate) {
    try {
      const metrics = await db.Metrics.findAll({
        where: {
          date: {
            [db.Sequelize.Op.between]: [startDate, endDate]
          },
          offer_id: {
            [db.Sequelize.Op.not]: null
          }
        },
        attributes: [
          'offer_id',
          [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
          [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
          [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
        ],
        include: [
          {
            model: db.Offer,
            attributes: ['name', 'payout']
          }
        ],
        group: ['offer_id'],
        raw: true
      });
      
      // Calculate derived metrics for each offer
      return metrics.map(record => {
        const impressions = parseInt(record.impressions) || 0;
        const clicks = parseInt(record.clicks) || 0;
        const lpviews = parseInt(record.lpviews) || 0;
        const conversions = parseInt(record.conversions) || 0;
        const revenue = parseFloat(record.revenue) || 0;
        const cost = parseFloat(record.cost) || 0;
        const profit = parseFloat(record.profit) || 0;
        
        return {
          dimension: record['Offer.name'] || `Offer ${record.offer_id}`,
          id: record.offer_id,
          payout: record['Offer.payout'] || 0,
          impressions,
          clicks,
          lpviews,
          conversions,
          revenue,
          cost,
          profit,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          cr: clicks > 0 ? (conversions / clicks) * 100 : 0,
          offer_cr: lpviews > 0 ? (conversions / lpviews) * 100 : 0,
          cpc: clicks > 0 ? cost / clicks : 0,
          cpm: impressions > 0 ? (cost / impressions) * 1000 : 0,
          roi: cost > 0 ? ((revenue - cost) / cost) * 100 : 0,
          epc: clicks > 0 ? revenue / clicks : 0,
          lpepc: lpviews > 0 ? revenue / lpviews : 0
        };
      });
    } catch (error) {
      console.error('Error getting metrics by offer:', error);
      throw error;
    }
  }

  /**
   * Get logs with detailed tracking information
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getLogs(req, res) {
    try {
      const { 
        startDate, 
        endDate, 
        campaignId, 
        trafficChannelId, 
        landerId, 
        offerId,
        conversion,
        page = 1,
        limit = 100
      } = req.query;
      
      // Validate dates
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const end = endDate ? new Date(endDate) : new Date();
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      // Build query conditions
      const whereConditions = {
        createdAt: {
          [db.Sequelize.Op.between]: [start, end]
        }
      };
      
      if (campaignId) {
        whereConditions.campaign_id = campaignId;
      }
      
      if (trafficChannelId) {
        whereConditions.traffic_channel_id = trafficChannelId;
      }
      
      if (landerId) {
        whereConditions.lander_id = landerId;
      }
      
      if (offerId) {
        whereConditions.offer_id = offerId;
      }
      
      if (conversion !== undefined) {
        whereConditions.conversion = conversion === 'true';
      }
      
      // Calculate pagination
      const offset = (page - 1) * limit;
      
      // Get logs
      const { count, rows } = await db.Click.findAndCountAll({
        where: whereConditions,
        include: [
          { model: db.Campaign, attributes: ['id', 'name'] },
          { model: db.TrafficChannel, attributes: ['id', 'name', 'type'] },
          { model: db.Lander, attributes: ['id', 'name'] },
          { model: db.Offer, attributes: ['id', 'name', 'payout'] },
          { model: db.Macro }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      // Format logs for response
      const logs = rows.map(click => {
        const clickData = click.toJSON();
        
        // Extract sub values from macro
        const subValues = {};
        if (clickData.Macro) {
          for (let i = 1; i <= 23; i++) {
            const subKey = `sub${i}`;
            if (clickData.Macro[subKey]) {
              subValues[subKey] = clickData.Macro[subKey];
            }
          }
        }
        
        return {
          id: clickData.id,
          uuid: clickData.uuid,
          timestamp: clickData.createdAt,
          ip: clickData.ip,
          country: clickData.country,
          city: clickData.city,
          device_type: clickData.device_type,
          os: clickData.os,
          browser: clickData.browser,
          referer: clickData.referer,
          landing_page_viewed: clickData.landing_page_viewed,
          conversion: clickData.conversion,
          conversion_time: clickData.conversion_time,
          revenue: clickData.revenue,
          cost: clickData.cost,
          profit: clickData.profit,
          campaign: clickData.Campaign ? {
            id: clickData.Campaign.id,
            name: clickData.Campaign.name
          } : null,
          traffic_channel: clickData.TrafficChannel ? {
            id: clickData.TrafficChannel.id,
            name: clickData.TrafficChannel.name,
            type: clickData.TrafficChannel.type
          } : null,
          lander: clickData.Lander ? {
            id: clickData.Lander.id,
            name: clickData.Lander.name
          } : null,
          offer: clickData.Offer ? {
            id: clickData.Offer.id,
            name: clickData.Offer.name,
            payout: clickData.Offer.payout
          } : null,
          sub_values: subValues
        };
      });
      
      // Prepare pagination info
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data: {
          logs,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
          }
        }
      });
    } catch (error) {
      console.error('Error getting logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get logs',
        error: error.message
      });
    }
  }
}

module.exports = new MetricsController();