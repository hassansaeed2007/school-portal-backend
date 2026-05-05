const express  = require("express");
const bcrypt   = require("bcryptjs");
const Teacher  = require("../models/Teacher");
const Student  = require("../models/Student");
const Subject  = require("../models/Subject");
const User     = require("../models/User");
const School   = require("../models/School");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { sendTeacherWelcome, sendStudentWelcome } = require("../utils/emailUtil");

const router = express.Router();
router.use(authMiddleware, requireRole("Admin"));

// Helper: get schoolId for logged-in admin
async function getSchoolId(adminId) {
  const school = await School.findOne({ adminId });
  return school?._id || null;
}

// GET /api/admin/school - get school info
router.get("/school", async (req, res) => {
  const school = await School.findOne({ adminId: req.user.id });
  res.json(school);
});
// GET /api/admin/teachers
router.get("/teachers", async (req, res) => {
  const schoolId = await getSchoolId(req.user.id);
  const teachers = await Teacher.find({ schoolId });
  res.json(teachers);
});

// POST /api/admin/teachers
router.post("/teachers", async (req, res) => {
  try {
    const schoolId = await getSchoolId(req.user.id);
    const { name, email, password, phone, qualification, department } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, and password are required." });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const teacher = await Teacher.create({ name, email, password: hashed, phone, qualification, department, role: "Teacher", schoolId });

    await sendTeacherWelcome(name, email, password);
    res.status(201).json({ message: "Teacher added successfully.", teacher });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students
router.get("/students", async (req, res) => {
  const schoolId = await getSchoolId(req.user.id);
  const students = await Student.find({ schoolId });
  res.json(students);
});

// POST /api/admin/students
router.post("/students", async (req, res) => {
  try {
    const schoolId = await getSchoolId(req.user.id);
    const { name, email, password, phone, rollNumber, semester, department } = req.body;

    if (!name || !email || !password || !rollNumber)
      return res.status(400).json({ message: "Name, email, password, and roll number are required." });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, email, password: hashed, phone, rollNumber, semester, department, role: "Student", schoolId });

    await sendStudentWelcome(name, email, password, rollNumber);
    res.status(201).json({ message: "Student added successfully.", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/subjects
router.get("/subjects", async (req, res) => {
  const schoolId = await getSchoolId(req.user.id);
  const subjects = await Subject.find({ schoolId }).populate("teacherId", "name department");
  res.json(subjects);
});

module.exports = router;
