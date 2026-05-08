const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "taskapp",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let isConnected = false;

const connectDB = async () => {
  try {
    const c = await pool.connect();
    c.release();
    isConnected = true;
    console.log("DB bağlı (pool)");
  } catch (err) {
    isConnected = false;
    console.error("DB Bağlantı Hatası:", err.message);
  }
};

pool.on("error", (err) => {
  console.error("Pool bağlantı hatası:", err.message);
  isConnected = false;
});

const getDBStatus = () => isConnected;

// Tüm route'lar client yerine pool.query kullanır — API değişmez
module.exports = { client: pool, connectDB, getDBStatus };
