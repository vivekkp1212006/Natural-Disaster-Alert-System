const mongoose = require('mongoose');
const { TRAINING_MODULE_KEYS } = require('../constants/trainingModules');

const volunteerTrainingProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moduleKey: {
      type: String,
      enum: TRAINING_MODULE_KEYS,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

volunteerTrainingProgressSchema.index({ user: 1, moduleKey: 1 }, { unique: true });

module.exports = mongoose.model('VolunteerTrainingProgress', volunteerTrainingProgressSchema);
