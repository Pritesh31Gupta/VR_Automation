1. Project Overview
Purpose
The Smart Lead Automation System is a full-stack application that automates the enrichment of
lead data using third-party APIs. It demonstrates skills in:
• Asynchronous data processing
• External API integration
• Business logic implementation
• Background task scheduling
• Full-stack development with MERN stack
Core Workflow
User Input → Backend Processing → External API Call → Data
Enrichment →
Database Storage → Background Sync → CRM Integration
(Simulated)
Tech Stack Justification
Frontend: React
• Component-based architecture for reusability
• Virtual DOM for efficient rendering
• Large ecosystem and community support
• Easy state management with hooks
Backend: Node.js + Express
• Non-blocking I/O perfect for API calls
• JavaScript across the stack (code reusability)
• npm ecosystem for easy package management
• Fast development with Express middleware
Database: MongoDB

• Flexible schema for lead data
• Easy to scale horizontally
• Native JSON support matches JavaScript objects
• Fast queries with proper indexing
2. System Architecture
High-Level Architecture
┌─────────────────┐
│ React App │ (Port 3000)
│ - Dashboard │
│ - Forms │
│ - Tables │
└────────┬────────┘
│ HTTP/REST
▼
┌─────────────────┐
│ Express API │ (Port 5000)
│ - Routes │
│ - Controllers │
│ - Services │
└────────┬────────┘
│
┌────┴────┐
│ │
▼ ▼
┌─────────┐ ┌──────────────┐
│ MongoDB │ │ Nationalize │
│Database │ │ .io API │
└─────────┘ └──────────────┘
▲
│ (Every 5 min)
┌───┴──────┐
│ Cron Job │
│ (Sync) │
└──────────┘
Backend Architecture Pattern: MVC + Services
Request Flow:
Client → Routes → Controller → Service → Model → Database
↓
Response
Why this pattern?
• Separation of Concerns: Each layer has a single responsibility

• Testability: Services can be tested independently
• Maintainability: Changes in one layer don't affect others
• Scalability: Easy to add new features
Directory Structure Explained
backend/
├── config/ # Configuration files (database
connection)
├── controllers/ # Handle HTTP requests/responses
├── models/ # Database schemas and models
├── routes/ # API endpoint definitions
├── services/ # Business logic and external API calls
├── utils/ # Helper functions (logger, etc.)
└── server.js # Application entry point
Why this structure?
• Industry standard MVC pattern
• Easy for other developers to understand
• Follows separation of concerns principle
3. Technical Implementation
3.1 Database Schema Design
// models/Lead.js
const leadSchema = new mongoose.Schema({
name: {
type: String,
required: true,
trim: true // Remove whitespace
},
mostLikelyCountry: {
type: String,
required: true
},
countryCode: {
type: String,
required: true
},
probability: {
type: Number,
required: true,
min: 0, // Validation
max: 1
},
status: {

type: String,
enum: ['Verified', 'To Check'], // Only these values
allowed
required: true
},
synced: {
type: Boolean,
default: false // For idempotency
},
syncedAt: {
type: Date,
default: null
},
createdAt: {
type: Date,
default: Date.now
}
});
// Index for performance
leadSchema.index({ status: 1, synced: 1 });
Interview Talking Points:
• Validation at schema level: Ensures data integrity
• Enum for status: Prevents invalid status values
• Indexing strategy: { status: 1, synced: 1 } makes sync queries fast
• Default values: Reduces code complexity
• Timestamps: Audit trail for debugging
3.2 Asynchronous API Processing
The Challenge
Process multiple names efficiently without blocking the server.
Solution: Promise.all() for Concurrent Requests
// services/enrichmentService.js
async enrichBatch(names) {
// Create array of promises
const promises = names.map(name => this.enrichName(name));
// Execute all promises concurrently
return await Promise.all(promises);
}
Why Promise.all()?

*Note: We handle errors individually in enrichName(), so Promise.all() works well.
Error Handling Strategy
async enrichName(name) {
try {
const response = await axios.get(`https://
api.nationalize.io`, {
params: { name: name.trim() }
});
// Process response...
} catch (error) {
console.error(`Error enriching name ${name}:`,
error.message);
// Return default "To Check" status instead of failing
return {
name: name.trim(),
mostLikelyCountry: 'Error',
countryCode: 'XX',
probability: 0,
status: 'To Check'
};
}
}
Interview Talking Points:
• Each API call handles its own errors
• Partial failure doesn't crash the entire batch
• Failed leads marked as "To Check" for manual review
• User always gets a response, even if API fails
3.3 Business Logic Implementation
// Decision logic in enrichmentService.js
const topCountry = data.country.reduce((prev, current) =>
(prev.probability > current.probability) ? prev : current
);
Approach Time for 10
names

Pros Cons

Sequential (for
loop) ~10 seconds Simple Slow

Promise.all() ~1 second Fast, concurrent All-or-
nothing*

Promise.allSettled() ~1 second Continues on

error More complex

return {
name: name.trim(),
mostLikelyCountry:
this.getCountryName(topCountry.country_id),
countryCode: topCountry.country_id,
probability: topCountry.probability,
status: topCountry.probability > 0.6 ? 'Verified' : 'To
Check' // Rule
};
Business Rules:
1. Probability > 60% → Status = "Verified"
2. Probability ≤ 60% → Status = "To Check"
Why 60% threshold?
• Balance between automation and accuracy
• High-confidence leads proceed automatically
• Uncertain leads flagged for human review
• Configurable for different business needs
3.4 Idempotent Background Sync
The Problem
Prevent duplicate CRM syncs even if cron job runs multiple times.
Solution: Database Flag + Query Filter
// services/syncService.js
async syncVerifiedLeads() {
// Query ONLY un-synced, verified leads
const leadsToSync = await Lead.find({
status: 'Verified',
synced: false // Critical filter
});
for (const lead of leadsToSync) {
// Simulate CRM sync
await this.simulateCRMSync(lead);
// Mark as synced (idempotency)
lead.synced = true;
lead.syncedAt = new Date();
await lead.save();
logger.info(`[CRM Sync] Sending verified lead $
{lead.name} to Sales Team...`);

}
}
Idempotency Guarantees:
1. Database-level: Query filters out synced leads
2. Atomic updates: Each lead marked synced immediately
3. Audit trail: syncedAt timestamp for debugging
4. Indexed query: Fast performance with composite index
Interview Question: "What if the server crashes mid-sync?" Answer: Each lead is saved
individually, so partially completed syncs are fine. Already-synced leads won't be re-synced because
their synced flag is true.

3.5 Cron Job Scheduling
// server.js
const cron = require('node-cron');
// Schedule: Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
logger.info('[CRON] Starting scheduled CRM sync...');
try {
const result = await syncService.syncVerifiedLeads();
logger.info(`[CRON] Sync completed: ${result.message}`);
} catch (error) {
logger.error(`[CRON] Sync failed: ${error.message}`);
}
});
Cron Expression Breakdown:
*/5 * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7) (not used = *)
│ │ │ └────── Month (1-12) (not used = *)
│ │ └───────── Day of month (1-31) (not used = *)
│ └──────────── Hour (0-23) (not used = *)
└──────────────── Minute (*/5 = every 5 minutes)
Why node-cron?
• Pure JavaScript (no system dependencies)
• Runs in the same process (access to app context)
• Easy to test and debug
• No separate cron daemon needed
Production Considerations:
• For production, consider: Bull Queue, Agenda, or AWS Lambda
• Separate process for reliability
• Better monitoring and error recovery

4. Key Design Decisions
Decision 1: MongoDB vs PostgreSQL
Chose MongoDB because:
• ✅ Flexible schema (easy to add fields later)
• ✅ JSON-like documents match JavaScript objects
• ✅ Horizontal scaling is easier
• ✅ Faster for read-heavy operations
Would choose PostgreSQL if:
• Complex relationships between entities
• Need ACID transactions
• Financial data requiring strict consistency
• Complex JOIN queries
Decision 2: REST API vs GraphQL
Chose REST because:
• ✅ Simple CRUD operations
• ✅ Standard HTTP methods
• ✅ Easy to cache
• ✅ Well-understood by all developers
Would choose GraphQL if:
• Multiple related entities
• Mobile app needing flexible queries
• Need to minimize over-fetching
• Complex data relationships
Decision 3: State Management (React Hooks vs Redux)
Chose React Hooks because:
• ✅ Simple application state
• ✅ No prop drilling issues
• ✅ Less boilerplate code
• ✅ Built-in to React
Would choose Redux if:
• Complex global state
• Multiple components need same data
• Time-travel debugging needed
• Large team standardization
