const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
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