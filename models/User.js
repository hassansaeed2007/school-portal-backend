const mongoose = require("mongoose");

/**
 * Base User schema - mirrors Java abstract User class.
 * Uses Mongoose discriminators for Admin/Teacher/Student (like inheritance).
 */
const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone:    { type: String, default: "" },
    role:     { type: String, enum: ["Admin", "Teacher", "Student"], required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", default: null },
  },
  { timestamps: true, discriminatorKey: "role" }
);

// Never return password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
