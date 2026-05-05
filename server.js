require("dotenv").config();
const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");

const { router: authRoutes, seedAdmin } = require("./routes/auth");
const adminRoutes   = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const testRoutes    = require("./routes/test");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://school-portal-frontend-pt1lnfqlc.vercel.app",
    "https://frontend-pi-orpin-56.vercel.app",
    /\.vercel\.app$/
  ],
  credentials: true
}));
app.use(express.json());

app.use("/api/auth",    authRoutes);
app.use("/api/admin",   adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/tests",   testRoutes);

app.get("/", (req, res) => res.json({ message: "School Portal API is running." }));

// Connect MongoDB once and reuse connection (serverless friendly)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
  await seedAdmin();
}

// For local development
if (process.env.NODE_ENV !== "production") {
  connectDB().then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on http://localhost:${process.env.PORT || 5000}`)
    );
  });
}

// Vercel serverless handler
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
