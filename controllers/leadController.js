const Lead = require('../models/Lead');
const enrichmentService = require('../services/enrichmentService');

class LeadController {
  async processBatch(req, res) {
    try {
      const { names } = req.body;

      if (!names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of names'
        });
      }

      // Filter out empty names
      const validNames = names.filter(name => name && name.trim().length > 0);

      if (validNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid names provided'
        });
      }

      // Enrich all names concurrently
      const enrichedData = await enrichmentService.enrichBatch(validNames);

      // Save to database
      const savedLeads = await Lead.insertMany(enrichedData);

      return res.status(201).json({
        success: true,
        message: `Successfully processed ${savedLeads.length} leads`,
        data: savedLeads
      });
    } catch (error) {
      console.error('Error processing batch:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing leads',
        error: error.message
      });
    }
  }

  async getAllLeads(req, res) {
    try {
      const { status } = req.query;
      
      const filter = {};
      if (status && ['Verified', 'To Check'].includes(status)) {
        filter.status = status;
      }

      const leads = await Lead.find(filter).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: leads.length,
        data: leads
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching leads',
        error: error.message
      });
    }
  }

  async getStats(req, res) {
    try {
      const totalLeads = await Lead.countDocuments();
      const verifiedLeads = await Lead.countDocuments({ status: 'Verified' });
      const toCheckLeads = await Lead.countDocuments({ status: 'To Check' });
      const syncedLeads = await Lead.countDocuments({ synced: true });

      return res.status(200).json({
        success: true,
        data: {
          total: totalLeads,
          verified: verifiedLeads,
          toCheck: toCheckLeads,
          synced: syncedLeads
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching statistics',
        error: error.message
      });
    }
  }
}

module.exports = new LeadController();