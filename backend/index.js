require("dotenv").config();
const logger = require("./utils/logger");

process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { reason: String(reason) });
});
process.on("uncaughtException", (err) => {
  logger.error("uncaughtException", { message: err.message, stack: err.stack });
});

const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  logger.info("Veritabanı bağlantısı kuruldu");
}).catch((err) => {
  logger.error("Veritabanı bağlantısı kurulamadı", { message: err.message });
}).finally(() => {
  app.listen(PORT, () => {
    logger.info(`Server başladı — port: ${PORT}, ortam: ${process.env.NODE_ENV || "development"}`);
  });
});
