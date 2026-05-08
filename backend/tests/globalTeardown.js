require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { Pool } = require("pg");

module.exports = async () => {
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
  await pool.end();
};
