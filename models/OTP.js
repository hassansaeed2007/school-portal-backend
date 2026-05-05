const mongoose = require("mongoose");

/**
 * Temporary OTP storage.
 * Expires after 10 minutes automatically (TTL index).
 */
const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  userData:  { type: Object, required: true }, // store signup data until verified
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

module.exports = mongoose.model("OTP", otpSchema);
