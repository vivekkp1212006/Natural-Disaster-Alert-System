const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    // Which user received the alert
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Type of disaster
    type: {
      type: String,
      enum: ['earthquake', 'flood'],
      required: true,
    },

    // Reference to disaster source
    // earthquake → USGS quake id
    // flood → location+date key
    referenceId: {
      type: String,
      required: true,
    },

    // Severity level
    riskLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH'],
      required: true,
    },

    // When alert should expire (TTL)
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Alert', alertSchema);
