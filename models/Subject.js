const mongoose = require("mongoose");

/**
 * Subject model - mirrors Java Subject class.
 * OOP: enrollStudent() and removeStudent() as instance methods.
 */
const subjectSchema = new mongoose.Schema(
  {
    name:               { type: String, required: true, trim: true },
    creditHours:        { type: String, default: "3" },
    teacherId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    enrolledStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    schoolId:           { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  },
  { timestamps: true }
);

// OOP: instance method - mirrors Java Subject.enrollStudent()
subjectSchema.methods.enrollStudent = function (studentId) {
  if (!this.enrolledStudentIds.map(String).includes(String(studentId))) {
    this.enrolledStudentIds.push(studentId);
  }
};

// OOP: instance method - mirrors Java Subject.removeStudent()
subjectSchema.methods.removeStudent = function (studentId) {
  this.enrolledStudentIds = this.enrolledStudentIds.filter(
    (id) => String(id) !== String(studentId)
  );
};

module.exports = mongoose.model("Subject", subjectSchema);
