const Admin = require("./Admin");
const Teacher = require("./Teacher");
const Student = require("./Student");
const Subject = require("./Subject");
const AttendanceRecord = require("./AttendanceRecord");

/**
 * Singleton in-memory data store.
 * Acts as the application database.
 */
class DataStore {
  constructor() {
    this.admins = [];
    this.teachers = [];
    this.students = [];
    this.subjects = [];
    this.attendance = [];
    this._seed();
  }

  _seed() {
    // Default admin account
    this.admins.push(new Admin("A001", "System Admin", "admin@school.edu", "admin123", "0300-0000000"));
  }

  // ── ID Generator ──────────────────────────────────────────
  generateId(prefix) {
    const counts = { T: this.teachers.length, S: this.students.length, SUB: this.subjects.length };
    const num = (counts[prefix] ?? 0) + 1;
    return `${prefix}${String(num).padStart(3, "0")}`;
  }

  // ── Auth ──────────────────────────────────────────────────
  authenticate(email, password) {
    const all = [...this.admins, ...this.teachers, ...this.students];
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password) || null;
  }

  emailExists(email) {
    const all = [...this.admins, ...this.teachers, ...this.students];
    return all.some((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  // ── Teachers ──────────────────────────────────────────────
  addTeacher(teacher) { this.teachers.push(teacher); }
  findTeacherById(id) { return this.teachers.find((t) => t.id === id) || null; }

  // ── Students ──────────────────────────────────────────────
  addStudent(student) { this.students.push(student); }
  findStudentById(id) { return this.students.find((s) => s.id === id) || null; }

  // ── Subjects ──────────────────────────────────────────────
  addSubject(subject) { this.subjects.push(subject); }
  findSubjectById(id) { return this.subjects.find((s) => s.id === id) || null; }
  getSubjectsByTeacher(teacherId) { return this.subjects.filter((s) => s.teacherId === teacherId); }

  // ── Attendance ────────────────────────────────────────────
  addAttendanceRecord(record) { this.attendance.push(record); }
  getAttendanceBySubject(subjectId) { return this.attendance.filter((r) => r.subjectId === subjectId); }
}

// Singleton instance
const instance = new DataStore();
module.exports = instance;
