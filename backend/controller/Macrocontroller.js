const macroService = require('../services/macroService');
const db = require('../models');

class MacroController {
  /**
   * Create a new macro mapping for a traffic channel
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async createMacroMapping(req, res) {
    try {
      const { traffic_channel_id, macro_format } = req.body;
      
      if (!traffic_channel_id || !macro_format) {
        return res.status(400).json({ 
          success: false, 
          message: 'Traffic channel ID and macro format are required' 
        });
      }
      
      // Find the traffic channel
      const trafficChannel = await db.TrafficChannel.findByPk(traffic_channel_id);
      if (!trafficChannel) {
        return res.status(404).json({ 
          success: false, 
          message: 'Traffic channel not found' 
        });
      }
      
      // Update the traffic channel with the new macro format
      trafficChannel.macro_format = macro_format;
      await trafficChannel.save();
      
      return res.status(200).json({
        success: true,
        message: 'Macro mapping created successfully',
        data: trafficChannel
      });
    } catch (error) {
      console.error('Error creating macro mapping:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create macro mapping',
        error: error.message
      });
    }
  }

  /**
   * Generate tracking URL with macros for a campaign
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async generateTrackingUrl(req, res) {
    try {
      const { traffic_channel_id, unique_id, params } = req.body;
      
      if (!traffic_channel_id || !unique_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Traffic channel ID and campaign ID are required' 
        });
      }
      
      const trackingUrl = await macroService.generateTrackingUrl(
        traffic_channel_id, 
        unique_id, 
        params || {}
      );
      
      return res.status(200).json({
        success: true,
        data: { trackingUrl }
      });
    } catch (error) {
      console.error('Error generating tracking URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate tracking URL',
        error: error.message
      });
    }
  }

  /**
   * Get macros for a specific click
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMacrosByClick(req, res) {
    try {
      const { click_id } = req.params;
      
      const macro = await db.Macro.findOne({
        where: { click_id }
      });
      
      if (!macro) {
        return res.status(404).json({ 
          success: false, 
          message: 'No macros found for this click' 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: macro
      });
    } catch (error) {
      console.error('Error fetching macros:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch macros',
        error: error.message
      });
    }
  }
}

module.exports = new MacroController();