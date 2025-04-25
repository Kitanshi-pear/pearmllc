// routes/metrics.js
const express = require("express");
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');

class MetricsService {
  /**
   * Find or create metrics record for a specific entity combination
   * @param {Object} params - Parameters to find/create metrics record
   * @returns {Object} - Metrics record
   */
  async getMetricsRecord(params) {
    try {
      // Set default date to today if not provided
      if (!params.date) {
        const today = new Date();
        params.date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Add hour if hourly tracking is enabled
        if (params.hourly) {
          params.hour = today.getHours();
        }
        
        // Remove hourly flag
        delete params.hourly;
      }
      
      // Find or create the metrics record
      const [metrics, created] = await db.Metrics.findOrCreate({
        where: params,
        defaults: {
          // Default values for a new record
          impressions: 0,
          clicks: 0,
          lpviews: 0,
          lpclicks: 0,
          conversions: 0,
          total_revenue: 0,
          total_cost: 0,
          profit: 0
        }
      });
      
      return metrics;
    } catch (error) {
      console.error('Error getting metrics record:', error);
      throw error;
    }
  }

  /**
   * Increment impression metrics
   * @param {Number} campaignId - Campaign ID
   * @param {Number} trafficChannelId - Traffic channel ID
   * @param {Number} impressions - Number of impressions to add (default: 1)
   */
  async incrementImpressionMetrics(campaignId, trafficChannelId, impressions = 1) {
    try {
      // Get campaign data to check for lander and offer
      const campaign = await db.Campaign.findByPk(campaignId);
      if (!campaign) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }
      
      // Update campaign level metrics
      const campaignMetrics = await this.getMetricsRecord({
        campaign_id: campaignId,
        hourly: true
      });
      
      campaignMetrics.impressions += impressions;
      await campaignMetrics.save();
      
      // Update traffic channel metrics
      if (trafficChannelId) {
        const trafficChannelMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          hourly: true
        });
        
        trafficChannelMetrics.impressions += impressions;
        await trafficChannelMetrics.save();
      }
      
      // Update lander metrics
      if (campaign.lander_id) {
        const landerMetrics = await this.getMetricsRecord({
          lander_id: campaign.lander_id,
          hourly: true
        });
        
        landerMetrics.impressions += impressions;
        await landerMetrics.save();
      }
      
      // Update offer metrics
      if (campaign.offer_id) {
        const offerMetrics = await this.getMetricsRecord({
          offer_id: campaign.offer_id,
          hourly: true
        });
        
        offerMetrics.impressions += impressions;
        await offerMetrics.save();
      }
      
      // Update combined metrics records
      if (trafficChannelId && campaign.lander_id) {
        const tcLanderMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          lander_id: campaign.lander_id,
          hourly: true
        });
        
        tcLanderMetrics.impressions += impressions;
        await tcLanderMetrics.save();
      }
      
      if (trafficChannelId && campaign.offer_id) {
        const tcOfferMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          offer_id: campaign.offer_id,
          hourly: true
        });
        
        tcOfferMetrics.impressions += impressions;
        await tcOfferMetrics.save();
      }
      
      // Update campaign-specific combinations
      if (campaign.lander_id && campaign.offer_id) {
        const campaignLanderOfferMetrics = await this.getMetricsRecord({
          campaign_id: campaignId,
          lander_id: campaign.lander_id,
          offer_id: campaign.offer_id,
          hourly: true
        });
        
        campaignLanderOfferMetrics.impressions += impressions;
        await campaignLanderOfferMetrics.save();
      }
      
      // Recalculate derived metrics (CTR, etc.)
      await this.updateDerivedMetrics(campaignId, trafficChannelId, campaign.lander_id, campaign.offer_id);
      
    } catch (error) {
      console.error('Error incrementing impression metrics:', error);
      throw error;
    }
  }

  /**
   * Increment click metrics for all related entities
   * @param {Number} campaignId - Campaign ID
   * @param {Number} trafficChannelId - Traffic channel ID
   * @param {Number} landerId - Lander ID
   * @param {Number} offerId - Offer ID
   * @param {Number} cost - Cost of this click
   */
  async incrementClickMetrics(campaignId, trafficChannelId, landerId, offerId, cost = 0) {
    try {
      // Update campaign metrics
      const campaignMetrics = await this.getMetricsRecord({
        campaign_id: campaignId,
        hourly: true
      });
      
      campaignMetrics.clicks += 1;
      campaignMetrics.total_cost += cost;
      await campaignMetrics.save();
      
      // Update traffic channel metrics
      if (trafficChannelId) {
        const trafficChannelMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          hourly: true
        });
        
        trafficChannelMetrics.clicks += 1;
        trafficChannelMetrics.total_cost += cost;
        await trafficChannelMetrics.save();
      }
      
      // Update lander metrics
      if (landerId) {
        const landerMetrics = await this.getMetricsRecord({
          lander_id: landerId,
          hourly: true
        });
        
        landerMetrics.clicks += 1;
        landerMetrics.total_cost += cost;
        await landerMetrics.save();
      }
      
      // Update offer metrics
      if (offerId) {
        const offerMetrics = await this.getMetricsRecord({
          offer_id: offerId,
          hourly: true
        });
        
        offerMetrics.clicks += 1;
        offerMetrics.total_cost += cost;
        await offerMetrics.save();
      }
      
      // Update combined metrics
      if (trafficChannelId && landerId) {
        const tcLanderMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          lander_id: landerId,
          hourly: true
        });
        
        tcLanderMetrics.clicks += 1;
        tcLanderMetrics.total_cost += cost;
        await tcLanderMetrics.save();
      }
      
      if (trafficChannelId && offerId) {
        const tcOfferMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          offer_id: offerId,
          hourly: true
        });
        
        tcOfferMetrics.clicks += 1;
        tcOfferMetrics.total_cost += cost;
        await tcOfferMetrics.save();
      }
      
      if (landerId && offerId) {
        const landerOfferMetrics = await this.getMetricsRecord({
          lander_id: landerId,
          offer_id: offerId,
          hourly: true
        });
        
        landerOfferMetrics.clicks += 1;
        landerOfferMetrics.total_cost += cost;
        await landerOfferMetrics.save();
      }
      
      // Update campaign-specific combinations
      if (campaignId && landerId && offerId) {
        const campaignLanderOfferMetrics = await this.getMetricsRecord({
          campaign_id: campaignId,
          lander_id: landerId,
          offer_id: offerId,
          hourly: true
        });
        
        campaignLanderOfferMetrics.clicks += 1;
        campaignLanderOfferMetrics.total_cost += cost;
        await campaignLanderOfferMetrics.save();
      }
      
      // Recalculate derived metrics
      await this.updateDerivedMetrics(campaignId, trafficChannelId, landerId, offerId);
      
    } catch (error) {
      console.error('Error incrementing click metrics:', error);
      throw error;
    }
  }

  /**
   * Increment landing page view metrics
   * @param {Number} campaignId - Campaign ID
   * @param {Number} trafficChannelId - Traffic channel ID
   * @param {Number} landerId - Lander ID
   */
  async incrementLanderViewMetrics(campaignId, trafficChannelId, landerId) {
    try {
      // Get campaign to check for offer
      const campaign = await db.Campaign.findByPk(campaignId);
      const offerId = campaign ? campaign.offer_id : null;
      
      // Update campaign metrics
      const campaignMetrics = await this.getMetricsRecord({
        campaign_id: campaignId,
        hourly: true
      });
      
      campaignMetrics.lpviews += 1;
      await campaignMetrics.save();
      
      // Update traffic channel metrics
      if (trafficChannelId) {
        const trafficChannelMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          hourly: true
        });
        
        trafficChannelMetrics.lpviews += 1;
        await trafficChannelMetrics.save();
      }
      
      // Update lander metrics
      if (landerId) {
        const landerMetrics = await this.getMetricsRecord({
          lander_id: landerId,
          hourly: true
        });
        
        landerMetrics.lpviews += 1;
        await landerMetrics.save();
      }
      
      // Update combined metrics
      if (trafficChannelId && landerId) {
        const tcLanderMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          lander_id: landerId,
          hourly: true
        });
        
        tcLanderMetrics.lpviews += 1;
        await tcLanderMetrics.save();
      }
      
      if (landerId && offerId) {
        const landerOfferMetrics = await this.getMetricsRecord({
          lander_id: landerId,
          offer_id: offerId,
          hourly: true
        });
        
        landerOfferMetrics.lpviews += 1;
        await landerOfferMetrics.save();
      }
      
      // Update campaign-specific combinations
      if (campaignId && landerId && offerId) {
        const campaignLanderOfferMetrics = await this.getMetricsRecord({
          campaign_id: campaignId,
          lander_id: landerId,
          offer_id: offerId,
          hourly: true
        });
        
        campaignLanderOfferMetrics.lpviews += 1;
        await campaignLanderOfferMetrics.save();
      }
      
      // Recalculate derived metrics
      await this.updateDerivedMetrics(campaignId, trafficChannelId, landerId, offerId);
      
    } catch (error) {
      console.error('Error incrementing lander view metrics:', error);
      throw error;
    }
  }

  /**
   * Increment conversion metrics
   * @param {Number} campaignId - Campaign ID
   * @param {Number} trafficChannelId - Traffic channel ID
   * @param {Number} landerId - Lander ID
   * @param {Number} offerId - Offer ID
   * @param {Number} revenue - Revenue amount
   * @param {Number} cost - Cost amount
   */
  async incrementConversionMetrics(campaignId, trafficChannelId, landerId, offerId, revenue = 0, cost = 0) {
    try {
      const profit = revenue - cost;
      
      // Update campaign metrics
      const campaignMetrics = await this.getMetricsRecord({
        campaign_id: campaignId,
        hourly: true
      });
      
      campaignMetrics.conversions += 1;
      campaignMetrics.total_revenue += revenue;
      campaignMetrics.profit += profit;
      await campaignMetrics.save();
      
      // Update traffic channel metrics
      if (trafficChannelId) {
        const trafficChannelMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          hourly: true
        });
        
        trafficChannelMetrics.conversions += 1;
        trafficChannelMetrics.total_revenue += revenue;
        trafficChannelMetrics.profit += profit;
        await trafficChannelMetrics.save();
      }
      
      // Update lander metrics
      if (landerId) {
        const landerMetrics = await this.getMetricsRecord({
          lander_id: landerId,
          hourly: true
        });
        
        landerMetrics.conversions += 1;
        landerMetrics.total_revenue += revenue;
        landerMetrics.profit += profit;
        await landerMetrics.save();
      }
      
      // Update offer metrics
      if (offerId) {
        const offerMetrics = await this.getMetricsRecord({
          offer_id: offerId,
          hourly: true
        });
        
        offerMetrics.conversions += 1;
        offerMetrics.total_revenue += revenue;
        offerMetrics.profit += profit;
        await offerMetrics.save();
      }
      
      // Update combined metrics
      if (trafficChannelId && landerId) {
        const tcLanderMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          lander_id: landerId,
          hourly: true
        });
        
        tcLanderMetrics.conversions += 1;
        tcLanderMetrics.total_revenue += revenue;
        tcLanderMetrics.profit += profit;
        await tcLanderMetrics.save();
      }
      
      if (trafficChannelId && offerId) {
        const tcOfferMetrics = await this.getMetricsRecord({
          traffic_channel_id: trafficChannelId,
          offer_id: offerId,
          hourly: true
        });
        
        tcOfferMetrics.conversions += 1;
        tcOfferMetrics.total_revenue += revenue;
        tcOfferMetrics.profit += profit;
        await tcOfferMetrics.save();
      }
      
      if (landerId && offerId) {
        const landerOfferMetrics = await this.getMetricsRecord({
          lander_id: landerId,
          offer_id: offerId,
          hourly: true
        });
        
        landerOfferMetrics.conversions += 1;
        landerOfferMetrics.total_revenue += revenue;
        landerOfferMetrics.profit += profit;
        await landerOfferMetrics.save();
      }
      
      // Update campaign-specific combinations
      if (campaignId && landerId && offerId) {
        const campaignLanderOfferMetrics = await this.getMetricsRecord({
          campaign_id: campaignId,
          lander_id: landerId,
          offer_id: offerId,
          hourly: true
        });
        
        campaignLanderOfferMetrics.conversions += 1;
        campaignLanderOfferMetrics.total_revenue += revenue;
        campaignLanderOfferMetrics.profit += profit;
        await campaignLanderOfferMetrics.save();
      }
      
      // Recalculate derived metrics
      await this.updateDerivedMetrics(campaignId, trafficChannelId, landerId, offerId);
      
    } catch (error) {
      console.error('Error incrementing conversion metrics:', error);
      throw error;
    }
  }

  /**
   * Update derived metrics (CTR, CR, EPC, etc.)
   * @param {Number} campaignId - Campaign ID
   * @param {Number} trafficChannelId - Traffic channel ID
   * @param {Number} landerId - Lander ID
   * @param {Number} offerId - Offer ID
   */
  async updateDerivedMetrics(campaignId, trafficChannelId, landerId, offerId) {
    try {
      // Helper function to update derived metrics for a single record
      const updateRecord = async (record) => {
        // Calculate CTR (Click-Through Rate)
        if (record.impressions > 0) {
          record.ctr = (record.clicks / record.impressions) * 100;
        }
        
        // Calculate CPC (Cost per Click)
        if (record.clicks > 0) {
          record.cpc = record.total_cost / record.clicks;
        }
        
        // Calculate CPM (Cost per Thousand Impressions)
        if (record.impressions > 0) {
          record.cpm = (record.total_cost / record.impressions) * 1000;
        }
        
        // Calculate CR (Conversion Rate)
        if (record.clicks > 0) {
          record.cr = (record.conversions / record.clicks) * 100;
        }
        
        // Calculate offer CR (from landing page views)
        if (record.lpviews > 0) {
          record.offer_cr = (record.conversions / record.lpviews) * 100;
        }
        
        // Calculate EPC (Earnings per Click)
        if (record.clicks > 0) {
          record.epc = record.total_revenue / record.clicks;
        }
        
        // Calculate LPEPC (Landing Page EPC)
        if (record.lpviews > 0) {
          record.lpepc = record.total_revenue / record.lpviews;
        }
        
        // Calculate CTC (Cost to Conversion)
        if (record.conversions > 0) {
          record.ctc = record.total_cost / record.conversions;
          record.total_cpa = record.total_cost / record.conversions;
        }
        
        // Calculate ROI (Return on Investment)
        if (record.total_cost > 0) {
          record.roi = ((record.total_revenue - record.total_cost) / record.total_cost) * 100;
          record.total_roi = ((record.total_revenue - record.total_cost) / record.total_cost) * 100;
        }
        
        await record.save();
      };
      
      // Get all metrics records related to this event
      const metricsRecords = await db.Metrics.findAll({
        where: {
          [Op.or]: [
            { campaign_id: campaignId },
            { traffic_channel_id: trafficChannelId },
            { lander_id: landerId },
            { offer_id: offerId },
            {
              [Op.and]: [
                { traffic_channel_id: trafficChannelId },
                { lander_id: landerId }
              ]
            },
            {
              [Op.and]: [
                { traffic_channel_id: trafficChannelId },
                { offer_id: offerId }
              ]
            },
            {
              [Op.and]: [
                { lander_id: landerId },
                { offer_id: offerId }
              ]
            },
            {
              [Op.and]: [
                { campaign_id: campaignId },
                { lander_id: landerId },
                { offer_id: offerId }
              ]
            }
          ]
        }
      });
      
      // Update each record
      for (const record of metricsRecords) {
        await updateRecord(record);
      }
    } catch (error) {
      console.error('Error updating derived metrics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated metrics for a specific entity
   * @param {String} entityType - Type of entity (campaign, traffic_channel, lander, offer)
   * @param {Number} entityId - ID of the entity
   * @param {Date} startDate - Start date for metrics
   * @param {Date} endDate - End date for metrics
   * @returns {Object} - Aggregated metrics
   */
  async getAggregatedMetrics(entityType, entityId, startDate, endDate) {
    try {
      const whereClause = {
        [entityType === 'campaign' ? 'campaign_id' : 
         entityType === 'traffic_channel' ? 'traffic_channel_id' : 
         entityType === 'lander' ? 'lander_id' : 
         entityType === 'offer' ? 'offer_id' : 
         entityType === 'offer_source' ? 'offer_source_id' : 'campaign_id']: entityId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      // Get all metrics records for this entity within the date range
      const metricsRecords = await db.Metrics.findAll({
        where: whereClause,
        attributes: [
          [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'total_impressions'],
          [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'total_clicks'],
          [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'total_lpviews'],
          [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'total_conversions'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'sum_revenue'],
          [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'sum_cost'],
          [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'sum_profit']
        ],
        raw: true
      });
      
      if (!metricsRecords || metricsRecords.length === 0) {
        return {
          impressions: 0,
          clicks: 0,
          lpviews: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          ctr: 0,
          cr: 0,
          cpc: 0,
          cpm: 0,
          roi: 0,
          epc: 0
        };
      }
      
      const aggregated = metricsRecords[0];
      
      // Calculate derived metrics
      const impressions = parseInt(aggregated.total_impressions) || 0;
      const clicks = parseInt(aggregated.total_clicks) || 0;
      const lpviews = parseInt(aggregated.total_lpviews) || 0;
      const conversions = parseInt(aggregated.total_conversions) || 0;
      const revenue = parseFloat(aggregated.sum_revenue) || 0;
      const cost = parseFloat(aggregated.sum_cost) || 0;
      const profit = parseFloat(aggregated.sum_profit) || 0;
      
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const offerCr = lpviews > 0 ? (conversions / lpviews) * 100 : 0;
      const cpc = clicks > 0 ? cost / clicks : 0;
      const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
      const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
      const epc = clicks > 0 ? revenue / clicks : 0;
      const lpepc = lpviews > 0 ? revenue / lpviews : 0;
      const ctc = conversions > 0 ? cost / conversions : 0;
      
      return {
        impressions,
        clicks,
        lpviews,
        conversions,
        revenue,
        cost,
        profit,
        ctr,
        cr,
        offer_cr: offerCr,
        cpc,
        cpm,
        roi,
        epc,
        lpepc,
        ctc
      };
    } catch (error) {
      console.error('Error getting aggregated metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics breakdown by a dimension (e.g., by day, by hour, by country)
   * @param {String} entityType - Type of entity (campaign, traffic_channel, lander, offer)
   * @param {Number} entityId - ID of the entity
   * @param {String} dimension - Dimension to break down by (day, hour, country)
   * @param {Date} startDate - Start date for metrics
   * @param {Date} endDate - End date for metrics
   * @returns {Array} - Metrics broken down by dimension
   */
  async getMetricsByDimension(entityType, entityId, dimension, startDate, endDate) {
    try {
      let groupByClause, dimensionField;
      
      switch (dimension) {
        case 'day':
          groupByClause = ['date'];
          dimensionField = 'date';
          break;
        case 'hour':
          groupByClause = ['date', 'hour'];
          dimensionField = 'hour';
          break;
        case 'country':
          // For country breakdown, we need to join with the Click table
          // This will be handled differently
          break;
        default:
          groupByClause = ['date'];
          dimensionField = 'date';
      }
      
      const whereClause = {
        [entityType === 'campaign' ? 'campaign_id' : 
         entityType === 'traffic_channel' ? 'traffic_channel_id' : 
         entityType === 'lander' ? 'lander_id' : 
         entityType === 'offer' ? 'offer_id' : 
         entityType === 'offer_source' ? 'offer_source_id' : 'campaign_id']: entityId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      if (dimension === 'country') {
        // For country breakdown, we need to aggregate metrics from the Click table
        const clicks = await db.Click.findAll({
          attributes: [
            'country',
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'clicks'],
            [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN landing_page_viewed = true THEN 1 ELSE 0 END')), 'lpviews'],
            [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN conversion = true THEN 1 ELSE 0 END')), 'conversions'],
            [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'revenue'],
            [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'cost'],
            [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
          ],
          where: {
            [entityType === 'campaign' ? 'campaign_id' : 
             entityType === 'traffic_channel' ? 'traffic_channel_id' : 
             entityType === 'lander' ? 'lander_id' : 
             entityType === 'offer' ? 'offer_id' : 
             'campaign_id']: entityId,
            createdAt: {
              [Op.between]: [startDate, endDate]
            }
          },
          group: ['country'],
          raw: true
        });
        
        // Calculate derived metrics for each country
        return clicks.map(country => {
          const clicks = parseInt(country.clicks) || 0;
          const lpviews = parseInt(country.lpviews) || 0;
          const conversions = parseInt(country.conversions) || 0;
          const revenue = parseFloat(country.revenue) || 0;
          const cost = parseFloat(country.cost) || 0;
          const profit = parseFloat(country.profit) || 0;
          
          const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
          const offerCr = lpviews > 0 ? (conversions / lpviews) * 100 : 0;
          const cpc = clicks > 0 ? cost / clicks : 0;
          const epc = clicks > 0 ? revenue / clicks : 0;
          const lpepc = lpviews > 0 ? revenue / lpviews : 0;
          const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
          
          return {
            dimension: country.country || 'Unknown',
            clicks,
            lpviews,
            conversions,
            revenue,
            cost,
            profit,
            cr,
            offer_cr: offerCr,
            cpc,
            epc,
            lpepc,
            roi
          };
        });
      } else {
        // For day and hour breakdown, use the Metrics table
        const metricsRecords = await db.Metrics.findAll({
          where: whereClause,
          attributes: [
            ...groupByClause,
            [db.sequelize.fn('SUM', db.sequelize.col('impressions')), 'impressions'],
            [db.sequelize.fn('SUM', db.sequelize.col('clicks')), 'clicks'],
            [db.sequelize.fn('SUM', db.sequelize.col('lpviews')), 'lpviews'],
            [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'conversions'],
            [db.sequelize.fn('SUM', db.sequelize.col('total_revenue')), 'revenue'],
            [db.sequelize.fn('SUM', db.sequelize.col('total_cost')), 'cost'],
            [db.sequelize.fn('SUM', db.sequelize.col('profit')), 'profit']
          ],
          group: groupByClause,
          order: groupByClause,
          raw: true
        });
        
        // Calculate derived metrics for each dimension value
        return metricsRecords.map(record => {
          const impressions = parseInt(record.impressions) || 0;
          const clicks = parseInt(record.clicks) || 0;
          const lpviews = parseInt(record.lpviews) || 0;
          const conversions = parseInt(record.conversions) || 0;
          const revenue = parseFloat(record.revenue) || 0;
          const cost = parseFloat(record.cost) || 0;
          const profit = parseFloat(record.profit) || 0;
          
          const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
          const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
          const offerCr = lpviews > 0 ? (conversions / lpviews) * 100 : 0;
          const cpc = clicks > 0 ? cost / clicks : 0;
          const cpm = impressions > 0 ? (cost / impressions) * 1000 : 0;
          const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
          const epc = clicks > 0 ? revenue / clicks : 0;
          const lpepc = lpviews > 0 ? revenue / lpviews : 0;
          
          return {
            dimension: dimension === 'day' ? record.date : 
                      dimension === 'hour' ? `${record.date} ${record.hour}:00` : 
                      record[dimensionField],
            impressions,
            clicks,
            lpviews,
            conversions,
            revenue,
            cost,
            profit,
            ctr,
            cr,
            offer_cr: offerCr,
            cpc,
            cpm,
            roi,
            epc,
            lpepc
          };
        });
      }
    } catch (error) {
      console.error(`Error getting metrics by ${dimension}:`, error);
      throw error;
    }
  }
}

module.exports = new MetricsService();