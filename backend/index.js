const express = require("express");
const cors = require("cors");

const dbCheck = require("./middleware/dbCheck");
const { connectDB, getDBStatus } = require("./config/db");
const deadlineRoutes = require("./routes/deadlineRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "decatech-api",
    database: getDBStatus() ? "connected" : "disconnected",
  });
});

app.use(dbCheck);

app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/deadlines", deadlineRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server ${PORT} portta başladı.`);
  });
});