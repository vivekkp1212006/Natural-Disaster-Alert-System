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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DisciplinaryAction", disciplinaryActionSchema);
