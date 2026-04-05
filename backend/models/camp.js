const mongoose = require("mongoose");

const campSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  region: {
    type: String,
    required: true
  },

  district: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  campOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  capacity: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["active", "inactive", "closed"],
    default: "active"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Camp", campSchema);