const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");
const Admin   = require("../models/Admin");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const School  = require("../models/School");
const OTP     = require("../models/OTP");
const { sendOTPEmail, sendWelcomeVerified } = require("../utils/emailUtil");

const router = express.Router();

// ── Generate 6-digit OTP ──────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── POST /api/auth/login ──────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ── POST /api/auth/signup ─────────────────────────────────
// Step 1: Validate data, send OTP to email
router.post("/signup", async (req, res) => {
  try {
    const { role, name, email, password, phone, qualification, department, rollNumber, semester, schoolCode } = req.body;

    if (!role || !name || !email || !password)
      return res.status(400).json({ message: "Role, name, email and password are required." });

    // Check email not already registered
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "This email is already registered." });

    // Check if OTP already sent (pending verification)
    await OTP.deleteMany({ email: email.toLowerCase() }); // clear old OTPs

    const otp = generateOTP();
    const hashed = await bcrypt.hash(password, 10);

    // Store all signup data temporarily with OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp,
      userData: { role, name, email: email.toLowerCase(), password: hashed, phone, qualification, department, rollNumber, semester, schoolCode }
    });

    // Send OTP email
    await sendOTPEmail(name, email, otp);

    res.json({ message: `Verification code sent to ${email}. Please check your inbox.`, email });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────
// Step 2: Verify OTP, create account
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required." });

    const record = await OTP.findOne({ email: email.toLowerCase() });
    if (!record)
      return res.status(400).json({ message: "OTP expired or not found. Please sign up again." });

    if (record.otp !== otp.toString())
      return res.status(400).json({ message: "Invalid verification code. Please try again." });

    // OTP correct - create the user account
    const d = record.userData;
    let user;

    if (d.role === "Admin") {
      user = await Admin.create({ name: d.name, email: d.email, password: d.password, phone: d.phone, role: "Admin" });
      // Create school linked to this admin
      await School.create({ name: d.name, adminId: user._id });
      // Update admin with schoolId
      const school = await School.findOne({ adminId: user._id });
      user.schoolId = school._id;
      await user.save();
    } else if (d.role === "Teacher") {
      // Find school by schoolCode (school _id)
      const school = await School.findById(d.schoolCode);
      if (!school) return res.status(400).json({ message: "Invalid School Code. Please check and try again." });
      user = await Teacher.create({ name: d.name, email: d.email, password: d.password, phone: d.phone, qualification: d.qualification, department: d.department, role: "Teacher", schoolId: school._id });
    } else if (d.role === "Student") {
      const school = await School.findById(d.schoolCode);
      if (!school) return res.status(400).json({ message: "Invalid School Code. Please check and try again." });
      user = await Student.create({ name: d.name, email: d.email, password: d.password, phone: d.phone, rollNumber: d.rollNumber, semester: d.semester, role: "Student", schoolId: school._id });
    }

    // Delete used OTP
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Send welcome email
    await sendWelcomeVerified(d.name, d.email, d.role);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.status(201).json({ message: "Account verified and created successfully!", token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ── POST /api/auth/resend-otp ─────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const record = await OTP.findOne({ email: email.toLowerCase() });
    if (!record)
      return res.status(400).json({ message: "Session expired. Please sign up again." });

    const newOtp = generateOTP();
    record.otp = newOtp;
    record.createdAt = new Date();
    await record.save();

    await sendOTPEmail(record.userData.name, email, newOtp);
    res.json({ message: "New verification code sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ── GET /api/auth/school/:code - verify school code ──────
router.get("/school/:code", async (req, res) => {
  try {
    const school = await School.findById(req.params.code).select("name");
    if (!school) return res.status(404).json({ message: "School not found." });
    res.json({ name: school.name });
  } catch {
    res.status(404).json({ message: "Invalid school code." });
  }
});

// ── Seed default admin ────────────────────────────────────
async function seedAdmin() {
  const exists = await User.findOne({ role: "Admin" });
  if (!exists) {
    const hashed = await bcrypt.hash("admin123", 10);
    await Admin.create({ name: "System Admin", email: "admin@school.edu", password: hashed, phone: "0300-0000000", role: "Admin" });
    console.log("Default admin created: admin@school.edu / admin123");
  }
}

module.exports = { router, seedAdmin };
