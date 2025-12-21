const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ['user', 'admin', 'volunteer'],
      default: 'user',
    },

    requestedRole: {
  type: String,
  enum: ['volunteer', 'admin'],
  default: null,
  },

  requestStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: null,
  },

  roleRequestedAt: {
    type: Date,
    default: null,
  },

    location: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
