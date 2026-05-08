require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const dbCheck = require("./middleware/dbCheck");
const { connectDB, getDBStatus } = require("./config/db");
const deadlineRoutes = require("./routes/deadlineRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, cb) => {
      // origin undefined = curl / server-side / same-origin istekler
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} izin verilmedi`));
    },
    credentials: true,
  })
);

// ── Rate Limiting ──
// Login: 5 dakikada max 10 deneme — brute force koruması
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla deneme. 5 dakika bekleyin." },
});

// Genel API: dakikada 120 istek
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla istek. Lütfen bekleyin." },
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "decatech-api",
    database: getDBStatus() ? "connected" : "disconnected",
  });
});

app.use(dbCheck);
app.use(apiLimiter);

app.use("/users/login", loginLimiter);
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/deadlines", deadlineRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server ${PORT} portta başladı.`);
  });
});
