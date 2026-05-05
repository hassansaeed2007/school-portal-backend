const mongoose = require("mongoose");

/**
 * Test model - mirrors Java Test class.
 * OOP: assignMarks() and getGrade() as instance methods.
 */
const testSchema = new mongoose.Schema(
  {
    title:      { type: String, required: true, trim: true },
    subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    schoolId:   { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    totalMarks: { type: Number, required: true },
    date:       { type: String, required: true },
    results: [
      {
        studentId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        marksObtained: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// OOP: mirrors Java Test.assignMarks()
testSchema.methods.assignMarks = function (studentId, marks) {
  if (marks < 0 || marks > this.totalMarks) return false;
  const existing = this.results.find((r) => String(r.studentId) === String(studentId));
  if (existing) {
    existing.marksObtained = marks;
  } else {
    this.results.push({ studentId, marksObtained: marks });
  }
  return true;
};

// OOP: mirrors Java Test.getGrade()
testSchema.methods.getGrade = function (marks) {
  const pct = (marks / this.totalMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
};

module.exports = mongoose.model("Test", testSchema);
