const mongoose = require("mongoose");

const disasterOperationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    disasterType: {
      type: String,
      enum: ["earthquake", "flood", "landslide", "cyclone", "other"],
      default: "other"
    },
    location: {
      type: String,
      required: true
    },
    startsAt: {
      type: Date,
      required: true
    },
    endsAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ["planned", "active", "completed", "cancelled"],
      default: "planned"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignedVolunteers: [
      {
        volunteer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Volunteer"
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        assignedAt: {
          type: Date,
          default: Date.now
        },
        participationStatus: {
          type: String,
          enum: ["assigned", "joined", "completed", "absent"],
          default: "assigned"
        }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisasterOperation", disasterOperationSchema);
