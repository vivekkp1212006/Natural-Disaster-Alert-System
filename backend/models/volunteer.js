const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema(
{
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },

  age: {
    type: Number,
    required: true
  },
  phone: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  skills: [String],

  experienceYears: Number,

  region: String,

  district: String,

  assignedCamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Camp"
  },

  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },

  inReserve: {
    type: Boolean,
    default: false,
  },

  operationsParticipatedCount: {
    type: Number,
    default: 0,
  },

  rankingBadge: {
    type: String,
    enum: ["Bronze", "Silver", "Gold", "None"],
    default: "None",
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended", "deployed"],
    default: "pending"
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  approvedAt: Date,

  certified: {
    type: Boolean,
    default: false
  },

  teamLeader: {
    type: Boolean,
    default: false
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Volunteer", volunteerSchema);