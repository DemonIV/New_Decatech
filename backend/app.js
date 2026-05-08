const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const rateLimit = require("express-rate-limit");

const logger = require("./utils/logger");
const dbCheck = require("./middleware/dbCheck");
const { getDBStatus } = require("./config/db");
const deadlineRoutes = require("./routes/deadlineRoutes");
const projectRoutes  = require("./routes/projectRoutes");
const taskRoutes     = require("./routes/taskRoutes");
const userRoutes     = require("./routes/userRoutes");
const sseRoutes      = require("./routes/sseRoutes");

const app = express();
const isTest = process.env.NODE_ENV === "test";

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

// ── HTTP Request Logging (morgan → winston) ──
// Test ortamında sessiz; üretimde combined log dosyasına yazar
if (!isTest) {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
      // Başarılı health check'leri loglamayı atla (gürültüyü azalt)
      skip: (req) => req.path === "/health" && req.method === "GET",
    })
  );
}

// ── Rate Limiting ──
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isTest ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla deneme. 5 dakika bekleyin." },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit aşıldı: ${req.ip} → ${req.path}`);
    res.status(options.statusCode).json(options.message);
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 10000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Çok fazla istek. Lütfen bekleyin." },
});

app.use(express.json());

// ── Health ──
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
app.use("/users",     userRoutes);
app.use("/projects",  projectRoutes);
app.use("/tasks",     taskRoutes);
app.use("/deadlines", deadlineRoutes);
app.use("/events",    sseRoutes);

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack });
  res.status(500).json({ success: false, message: "Sunucu hatası" });
});

module.exports = app;
