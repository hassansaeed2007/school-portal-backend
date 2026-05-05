const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: `"School Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Email failed:", err.message);
  }
}

function sendTeacherWelcome(name, email, password) {
  return sendEmail(
    email,
    "Welcome - Teacher Account Created",
    `Dear ${name},\n\nYour teacher account has been created.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password.\n\nRegards,\nSchool Administration`
  );
}

function sendStudentWelcome(name, email, password, rollNumber) {
  return sendEmail(
    email,
    "Welcome - Student Account Created",
    `Dear ${name},\n\nYour student account has been created.\n\nEmail: ${email}\nPassword: ${password}\nRoll Number: ${rollNumber}\n\nLogin to browse and join subjects.\n\nRegards,\nSchool Administration`
  );
}

function sendAbsentNotification(name, email, subjectName, date) {
  return sendEmail(
    email,
    `Attendance Alert - ${subjectName}`,
    `Dear ${name},\n\nYou were marked ABSENT in "${subjectName}" on ${date}.\n\nContact your teacher if this is incorrect.\n\nRegards,\nSchool Administration`
  );
}

function sendOTPEmail(name, email, otp) {
  return sendEmail(
    email,
    "Your Verification Code - School Portal",
    `Dear ${name},\n\nYour email verification code is:\n\n` +
    `  ${otp}\n\n` +
    `This code expires in 10 minutes.\n` +
    `If you did not request this, please ignore this email.\n\n` +
    `Regards,\nSchool Administration`
  );
}

function sendWelcomeVerified(name, email, role) {
  return sendEmail(
    email,
    "Account Verified - Welcome to School Portal",
    `Dear ${name},\n\nYour ${role} account has been verified successfully!\n\n` +
    `You can now log in at: http://localhost:5173\n\n` +
    `Regards,\nSchool Administration`
  );
}

function sendMarksNotification(name, email, testTitle, subjectName, marksObtained, totalMarks, grade) {
  const percentage = Math.round((marksObtained / totalMarks) * 100);
  return sendEmail(
    email,
    `Result Announced - ${testTitle}`,
    `Dear ${name},\n\n` +
    `Your result for "${testTitle}" has been announced.\n\n` +
    `Subject   : ${subjectName}\n` +
    `Marks     : ${marksObtained} / ${totalMarks}\n` +
    `Percentage: ${percentage}%\n` +
    `Grade     : ${grade}\n\n` +
    `${grade === "F" ? "Please work harder and consult your teacher.\n\n" : "Keep up the good work!\n\n"}` +
    `Regards,\nSchool Administration`
  );
}

module.exports = { sendTeacherWelcome, sendStudentWelcome, sendAbsentNotification, sendOTPEmail, sendWelcomeVerified, sendMarksNotification };
