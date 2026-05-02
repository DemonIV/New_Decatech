const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "taskapp",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});

let isConnected = false;

const connectDB = async () => {
  try {
    await client.connect();
    isConnected = true;
    console.log("DB bağlı");
  } catch (err) {
    isConnected = false;
    console.error("DB Bağlantı Hatası:", err.message);
  }
};

const getDBStatus = () => isConnected;

module.exports = { client, connectDB, getDBStatus };