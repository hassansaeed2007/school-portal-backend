const express    = require("express");
const Subject    = require("../models/Subject");
const Student    = require("../models/Student");
const Attendance = require("../models/Attendance");
const { authMiddleware, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware, requireRole("Student"));

// GET /api/student/subjects - only subjects from student's school
router.get("/subjects", async (req, res) => {
  const student  = await Student.findById(req.user.id);
  // Only show subjects from the same school
  const subjects = await Subject.find({ schoolId: student.schoolId }).populate("teacherId", "name department");

  const result = subjects.map((sub) => ({
    _id:          sub._id,
    name:         sub.name,
    creditHours:  sub.creditHours,
    teacherName:  sub.teacherId?.name || "Unknown",
    department:   sub.teacherId?.department || "N/A",
    enrolledCount: sub.enrolledStudentIds.length,
    isJoined:     student.joinedSubjectIds.map(String).includes(String(sub._id)),
  }));

  res.json(result);
});

// POST /api/student/subjects/:id/join
router.post("/subjects/:id/join", async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);

    // Make sure subject belongs to same school
    const subject = await Subject.findOne({ _id: req.params.id, schoolId: student.schoolId });
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    // Use OOP method - mirrors Java student.joinSubject()
    const result = student.joinSubject(subject._id);
    if (!result.success) return res.status(400).json({ message: result.message });

    // Use OOP method - mirrors Java subject.enrollStudent()
    subject.enrollStudent(student._id);
    await student.save();
    await subject.save();

    res.json({ message: `Successfully joined "${subject.name}".` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/student/subjects/:id/leave
router.delete("/subjects/:id/leave", async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    const subject = await Subject.findOne({ _id: req.params.id, schoolId: student.schoolId });
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    // Use OOP method - mirrors Java student.leaveSubject()
    student.leaveSubject(subject._id);
    // Use OOP method - mirrors Java subject.removeStudent()
    subject.removeStudent(student._id);
    await student.save();
    await subject.save();

    res.json({ message: `You have left "${subject.name}".` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/attendance/:subjectId
router.get("/attendance/:subjectId", async (req, res) => {
  const student = await Student.findById(req.user.id);
  const records = await Attendance.find({ subjectId: req.params.subjectId, schoolId: student.schoolId });
  const result = [];
  let present = 0;

  for (const rec of records) {
    const entry = rec.records.find((r) => String(r.studentId) === req.user.id);
    if (entry) {
      result.push({ date: rec.date, present: entry.present });
      if (entry.present) present++;
    }
  }

  const total = result.length;
  res.json({
    records: result,
    summary: { total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
  });
});

// GET /api/student/profile
router.get("/profile", async (req, res) => {
  const student = await Student.findById(req.user.id).populate("joinedSubjectIds", "name creditHours");
  res.json(student);
});

module.exports = router;
