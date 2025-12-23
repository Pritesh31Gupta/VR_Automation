const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
    min: 0,
    max: 1
  },
  status: {
    type: String,
    enum: ['Verified', 'To Check'],
    required: true
  },
  synced: {
    type: Boolean,
    default: false
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

// Index for efficient querying
leadSchema.index({ status: 1, synced: 1 });

module.exports = mongoose.model('Lead', leadSchema);