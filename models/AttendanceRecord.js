/** Stores attendance for one class session (subject + date) */
class AttendanceRecord {
  constructor(subjectId, date) {
    this.subjectId = subjectId;
    this.date = date;
    // { studentId: true/false }
    this.attendance = {};
  }

  mark(studentId, present) {
    this.attendance[studentId] = present;
  }

  isPresent(studentId) {
    return this.attendance[studentId] === true;
  }
}

module.exports = AttendanceRecord;
