// Only load dotenv in local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express  = require("express");
const mongoose = require("mongoose");

const { router: authRoutes, seedAdmin } = require("./routes/auth");
const adminRoutes   = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const testRoutes    = require("./routes/test");

const app = express();

// CORS - manual for Vercel serverless compatibility
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(express.json());

app.use("/api/auth",    authRoutes);
app.use("/api/admin",   adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/tests",   testRoutes);

app.get("/", (req, res) => res.json({ message: "School Portal API is running." }));

// MongoDB - single connection reused across serverless invocations
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  isConnected = true;
  try { await seedAdmin(); } catch (e) { /* already seeded */ }
}

// Local dev server
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on http://localhost:${process.env.PORT || 5000}`)
    );
  }).catch(console.error);
}

// Vercel serverless export
module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
