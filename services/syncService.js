const Lead = require('../models/Lead');
const logger = require('../utils/logger');

class SyncService {
  async syncVerifiedLeads() {
    try {
      // Find verified leads that haven't been synced yet
      const leadsToSync = await Lead.find({
        status: 'Verified',
        synced: false
      });

      if (leadsToSync.length === 0) {
        logger.info('[CRM Sync] No verified leads to sync');
        return { synced: 0, message: 'No leads to sync' };
      }

      logger.info(`[CRM Sync] Found ${leadsToSync.length} verified leads to sync`);

      // Simulate CRM sync for each lead
      for (const lead of leadsToSync) {
        // Simulate CRM API call
        await this.simulateCRMSync(lead);

        // Mark as synced
        lead.synced = true;
        lead.syncedAt = new Date();
        await lead.save();

        logger.info(`[CRM Sync] Sending verified lead ${lead.name} to Sales Team...`);
      }

      return {
        synced: leadsToSync.length,
        message: `Successfully synced ${leadsToSync.length} leads`
      };
    } catch (error) {
      logger.error('[CRM Sync] Error:', error.message);
      throw error;
    }
  }

  async simulateCRMSync(lead) {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
  }
}

module.exports = new SyncService();