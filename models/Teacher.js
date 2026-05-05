const mongoose = require("mongoose");
const User = require("./User");

/**
 * Teacher model - mirrors Java Teacher class.
 * OOP: addSubjectId() as instance method.
 */
const teacherSchema = new mongoose.Schema({
  qualification: { type: String, default: "" },
  department:    { type: String, default: "" },
});

// OOP: instance method - mirrors Java Teacher.addSubjectId()
teacherSchema.methods.addSubjectId = function (subjectId) {
  // no-op here, subjects are stored in Subject model
  // kept for OOP consistency with Java class
};

const Teacher = User.discriminator("Teacher", teacherSchema);
module.exports = Teacher;
