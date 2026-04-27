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
      enum: ['user', 'admin', 'volunteer', 'camp_officer', 'team_leader'],
      default: 'user',
    },

  requestedRole: {
    type: String,
    enum: ['volunteer'],
    default: null,
  },

  suspension: {
    active: { type: Boolean, default: false },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    reason: { type: String, default: '' },
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
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailOtp: {
    type: Number,
  },
  emailOtpExpiresAt: {
    type: Date,
  },
  emailOtpPurpose: {
    type: String,
    enum: ['signup','password_reset'],
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  phoneOtp: {
    type: Number,
  },
  phoneOtpExpiresAt: {
    type:Date,
  },
  phoneOtpPurpose: {
    type: String,
    enum: ['phone_verification'],
  },
  otpRequestCount: {
    type: Number,
    default: 0,
  },
  otpRequestWindowStart: {
    type: Date,
    default: null,
  },
  lastOtpSentAt: {
    type: Date, 
  },
  otpFailedAttempts: {
    type: Number,
    default: 0,
  },
  otpLockUntil: {
    type: Date,
  }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
