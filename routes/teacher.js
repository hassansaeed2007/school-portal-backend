const express    = require("express");
const Subject    = require("../models/Subject");
const Student    = require("../models/Student");
const Attendance = require("../models/Attendance");
const Teacher    = require("../models/Teacher");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { sendAbsentNotification } = require("../utils/emailUtil");

const router = express.Router();
router.use(authMiddleware, requireRole("Teacher"));

// GET /api/teacher/subjects
router.get("/subjects", async (req, res) => {
  const teacher = await Teacher.findById(req.user.id);
  const subjects = await Subject.find({ teacherId: req.user.id, schoolId: teacher.schoolId });
  res.json(subjects);
});

// POST /api/teacher/subjects
router.post("/subjects", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    const { name, creditHours } = req.body;
    if (!name) return res.status(400).json({ message: "Subject name is required." });

    const subject = await Subject.create({
      name, creditHours: creditHours || "3",
      teacherId: req.user.id,
      schoolId: teacher.schoolId,
    });
    res.status(201).json({ message: "Subject added.", subject });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/subjects/:id/students
router.get("/subjects/:id/students", async (req, res) => {
  const teacher = await Teacher.findById(req.user.id);
  const subject = await Subject.findOne({ _id: req.params.id, teacherId: req.user.id, schoolId: teacher.schoolId });
  if (!subject) return res.status(404).json({ message: "Subject not found." });

  const students = await Student.find({ _id: { $in: subject.enrolledStudentIds } });
  res.json(students);
});

// POST /api/teacher/attendance
router.post("/attendance", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    const { subjectId, date, records } = req.body;

    if (!subjectId || !date || !records)
      return res.status(400).json({ message: "subjectId, date, and records are required." });

    const subject = await Subject.findOne({ _id: subjectId, teacherId: req.user.id, schoolId: teacher.schoolId });
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    // Use OOP method - mirrors Java AttendanceRecord constructor + markAttendance()
    const attendance = new Attendance({ subjectId, date, schoolId: teacher.schoolId, records: [] });
    for (const r of records) {
      attendance.mark(r.studentId, r.present);
    }
    await attendance.save();

    for (const r of records) {
      if (!r.present) {
        const student = await Student.findById(r.studentId);
        if (student) await sendAbsentNotification(student.name, student.email, subject.name, date);
      }
    }

    res.status(201).json({ message: "Attendance saved.", attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/attendance/:subjectId
router.get("/attendance/:subjectId", async (req, res) => {
  const teacher = await Teacher.findById(req.user.id);
  const subject = await Subject.findOne({ _id: req.params.subjectId, teacherId: req.user.id, schoolId: teacher.schoolId });
  if (!subject) return res.status(404).json({ message: "Subject not found." });

  const records = await Attendance.find({ subjectId: req.params.subjectId, schoolId: teacher.schoolId })
    .populate("records.studentId", "name rollNumber");
  res.json(records);
});

// GET /api/teacher/profile
router.get("/profile", async (req, res) => {
  const teacher = await Teacher.findById(req.user.id);
  res.json(teacher);
});

module.exports = router;
