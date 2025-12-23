require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const leadRoutes = require('./routes/leadRoutes');
const syncService = require('./services/syncService');
const logger = require('./utils/logger');

const app = express();

// Middleware

 app.use(cors({
  origin: 'https://enchanting-sopapillas-73dedd.netlify.app/',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Routes
app.use('/api/leads', leadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Schedule CRM sync every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('[CRON] Starting scheduled CRM sync...');
  try {
    const result = await syncService.syncVerifiedLeads();
    logger.info(`[CRON] Sync completed: ${result.message}`);
  } catch (error) {
    logger.error(`[CRON] Sync failed: ${error.message}`);
  }
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info('CRM sync scheduled to run every 5 minutes');
});
