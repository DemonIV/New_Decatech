const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = format;

const LOG_DIR = path.join(__dirname, "../logs");
const isTest  = process.env.NODE_ENV === "test";

// Konsol için okunabilir format
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`
  )
);

// Dosya için JSON format (parse edilebilir)
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: isTest ? "warn" : "http",
  silent: isTest,
  transports: [
    // Konsol — geliştirme ortamında renkli
    new transports.Console({ format: consoleFormat }),

    // Günlük dönen hata logu — 14 gün saklanır
    new transports.DailyRotateFile({
      filename:     path.join(LOG_DIR, "error-%DATE%.log"),
      datePattern:  "YYYY-MM-DD",
      level:        "error",
      format:       fileFormat,
      maxFiles:     "14d",
      zippedArchive: true,
    }),

    // Günlük dönen birleşik log — 30 gün saklanır
    new transports.DailyRotateFile({
      filename:     path.join(LOG_DIR, "combined-%DATE%.log"),
      datePattern:  "YYYY-MM-DD",
      format:       fileFormat,
      maxFiles:     "30d",
      zippedArchive: true,
    }),
  ],
});

module.exports = logger;
