require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

module.exports = async () => {
  process.env.NODE_ENV   = "test";
  process.env.DB_NAME    = "taskapp_test";
  process.env.JWT_SECRET = "test_secret_key";

  const pool = new Pool({
    user:     process.env.DB_USER     || "postgres",
    host:     process.env.DB_HOST     || "localhost",
    database: "taskapp_test",
    password: process.env.DB_PASSWORD,
    port:     Number(process.env.DB_PORT || 5432),
  });

  await pool.query(
    "TRUNCATE users, projects, tasks, deadlines, user_projects RESTART IDENTITY CASCADE"
  );

  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash  = await bcrypt.hash("user123", 10);

  await pool.query(
    "INSERT INTO users (username, password, role) VALUES ($1,$2,$3), ($4,$5,$6)",
    ["test_admin", adminHash, "admin", "test_user", userHash, "user"]
  );

  await pool.end();
};
