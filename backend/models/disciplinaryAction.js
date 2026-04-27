const mongoose = require("mongoose");

const disciplinaryActionSchema = new mongoose.Schema(
  {
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Volunteer",
      required: true
    },
    actionType: {
      type: String,
      enum: ["warning", "suspension"],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reviewedByAdmin: {
      type: Boolean,
      default: false
    },
    suspensionStart: {
      type: Date,
      default: null,
    },
    suspensionEnd: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisciplinaryAction", disciplinaryActionSchema);
