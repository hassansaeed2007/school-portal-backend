const mongoose = require("mongoose");

/**
 * School model - each admin creates one school.
 * All teachers, students, subjects belong to a school.
 */
const schoolSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("School", schoolSchema);
