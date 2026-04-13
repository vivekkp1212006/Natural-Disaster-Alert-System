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
    required
  },
  phone: {
    type: String,
    required
  },

  address: {
    type: String,
    required
  },

  skills: [String],

  experienceYears: Number,

  region: String,

  district: String,

  assignedCamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Camp"
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "suspended"],
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