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

// ── Process-level hata yakalayıcılar ──
// Herhangi bir route'dan kaçan hata süreci çökertmemeli
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err.message);
});

const app = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} izin verilmedi`));
    },
    credentials: true,
  })
);

// ── Rate Limiting ──
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla deneme. 5 dakika bekleyin." },
});

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

// ── Global hata handler ──
// next(err) ile gelen tüm hatalar buraya düşer, soket açık kalır
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(500).json({ success: false, message: "Sunucu hatası" });
});

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server ${PORT} portta başladı.`);
  });
});
