const mongoose = require("mongoose");
const { TRAINING_TYPES } = require("../constants/trainingTypes");

const trainingSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    trainingType: {
      type: String,
      enum: TRAINING_TYPES,
      required: true,
    },
    camp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camp",
      required: true
    },
    campOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    volunteers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Volunteer"
      }
    ],
    date: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TrainingSession", trainingSessionSchema);
