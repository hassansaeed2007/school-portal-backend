const express  = require("express");
const Test     = require("../models/Test");
const Subject  = require("../models/Subject");
const Student  = require("../models/Student");
const Teacher  = require("../models/Teacher");
const { authMiddleware, requireRole } = require("../middleware/auth");
const { sendMarksNotification } = require("../utils/emailUtil");

const router = express.Router();

// ── TEACHER ROUTES ────────────────────────────────────────
// POST /api/tests  - create a new test
router.post("/", authMiddleware, requireRole("Teacher"), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    const { title, subjectId, totalMarks, date } = req.body;

    if (!title || !subjectId || !totalMarks || !date)
      return res.status(400).json({ message: "title, subjectId, totalMarks and date are required." });

    const subject = await Subject.findOne({ _id: subjectId, teacherId: req.user.id });
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    const test = await Test.create({
      title, subjectId, totalMarks, date,
      teacherId: req.user.id,
      schoolId: teacher.schoolId,
    });

    res.status(201).json({ message: "Test created successfully.", test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/tests/teacher  - get all tests created by this teacher
router.get("/teacher", authMiddleware, requireRole("Teacher"), async (req, res) => {
  const teacher = await Teacher.findById(req.user.id);
  const tests = await Test.find({ teacherId: req.user.id, schoolId: teacher.schoolId })
    .populate("subjectId", "name");
  res.json(tests);
});

// GET /api/tests/:testId/students  - get enrolled students for a test's subject
router.get("/:testId/students", authMiddleware, requireRole("Teacher"), async (req, res) => {
  const test    = await Test.findById(req.params.testId);
  if (!test || String(test.teacherId) !== req.user.id)
    return res.status(404).json({ message: "Test not found." });

  const subject  = await Subject.findById(test.subjectId);
  const students = await Student.find({ _id: { $in: subject.enrolledStudentIds } });

  // Attach already-saved marks if any
  const result = students.map((s) => {
    const existing = test.results.find((r) => String(r.studentId) === String(s._id));
    return {
      _id:          s._id,
      name:         s.name,
      email:        s.email,
      rollNumber:   s.rollNumber,
      marksObtained: existing ? existing.marksObtained : "",
    };
  });

  res.json({ test, students: result });
});

// POST /api/tests/:testId/marks  - save marks + send emails
router.post("/:testId/marks", authMiddleware, requireRole("Teacher"), async (req, res) => {
  try {
    const { marks } = req.body; // [{ studentId, marksObtained }]
    const test = await Test.findById(req.params.testId);
    if (!test || String(test.teacherId) !== req.user.id)
      return res.status(404).json({ message: "Test not found." });

    const subject = await Subject.findById(test.subjectId);

    for (const entry of marks) {
      // Use OOP method - mirrors Java Test.assignMarks()
      const ok = test.assignMarks(entry.studentId, Number(entry.marksObtained));
      if (!ok) continue;

      // Send email to student
      const student = await Student.findById(entry.studentId);
      if (student) {
        const grade = test.getGrade(Number(entry.marksObtained));
        await sendMarksNotification(
          student.name, student.email,
          test.title, subject.name,
          entry.marksObtained, test.totalMarks, grade
        );
      }
    }

    await test.save();
    res.json({ message: "Marks saved and students notified via email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── STUDENT ROUTES ────────────────────────────────────────
// GET /api/tests/student  - get all test results for logged-in student
router.get("/student", authMiddleware, requireRole("Student"), async (req, res) => {
  const student = await Student.findById(req.user.id);
  const tests = await Test.find({
    schoolId: student.schoolId,
    subjectId: { $in: student.joinedSubjectIds },
    "results.studentId": req.user.id,
  }).populate("subjectId", "name");

  const result = tests.map((t) => {
    const myResult = t.results.find((r) => String(r.studentId) === req.user.id);
    const marks    = myResult ? myResult.marksObtained : null;
    return {
      _id:           t._id,
      title:         t.title,
      subject:       t.subjectId?.name,
      date:          t.date,
      totalMarks:    t.totalMarks,
      marksObtained: marks,
      percentage:    marks !== null ? Math.round((marks / t.totalMarks) * 100) : null,
      grade:         marks !== null ? t.getGrade(marks) : "N/A",
    };
  });

  res.json(result);
});

module.exports = router;
