const mongoose = require("mongoose");

/**
 * Attendance model - mirrors Java AttendanceRecord class.
 * OOP: mark() and isPresent() as instance methods.
 */
const attendanceSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    date:      { type: String, required: true },
    schoolId:  { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    records: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        present:   { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// OOP: instance method - mirrors Java AttendanceRecord.markAttendance()
attendanceSchema.methods.mark = function (studentId, present) {
  const existing = this.records.find((r) => String(r.studentId) === String(studentId));
  if (existing) {
    existing.present = present;
  } else {
    this.records.push({ studentId, present });
  }
};

// OOP: instance method - mirrors Java AttendanceRecord.isPresent()
attendanceSchema.methods.isPresent = function (studentId) {
  const record = this.records.find((r) => String(r.studentId) === String(studentId));
  return record?.present === true;
};

module.exports = mongoose.model("Attendance", attendanceSchema);
