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
    "https://school-portal-frontend.vercel.app",
    /\.vercel\.app$/  // any vercel subdomain
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

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected.");
    await seedAdmin(); // create default admin if not exists
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on http://localhost:${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("MongoDB connection failed:", err.message));
