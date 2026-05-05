const mongoose = require("mongoose");
const User = require("./User");

/**
 * Student model - mirrors Java Student class.
 * OOP: joinSubject() and leaveSubject() as instance methods.
 * Max 8 subjects enforced just like Java.
 */
const studentSchema = new mongoose.Schema({
  rollNumber:        { type: String, required: true, unique: true },
  semester:          { type: String, default: "" },
  department:        { type: String, default: "" },
  joinedSubjectIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
});

// OOP: instance method - mirrors Java Student.joinSubject()
studentSchema.methods.joinSubject = function (subjectId) {
  if (this.joinedSubjectIds.length >= Student.MAX_SUBJECTS) {
    return { success: false, message: `Maximum ${Student.MAX_SUBJECTS} subjects allowed.` };
  }
  if (this.joinedSubjectIds.map(String).includes(String(subjectId))) {
    return { success: false, message: "Already enrolled in this subject." };
  }
  this.joinedSubjectIds.push(subjectId);
  return { success: true };
};

// OOP: instance method - mirrors Java Student.leaveSubject()
studentSchema.methods.leaveSubject = function (subjectId) {
  const before = this.joinedSubjectIds.length;
  this.joinedSubjectIds = this.joinedSubjectIds.filter((id) => String(id) !== String(subjectId));
  return this.joinedSubjectIds.length < before;
};

const Student = User.discriminator("Student", studentSchema);
Student.MAX_SUBJECTS = 8;
module.exports = Student;
