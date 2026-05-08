require("dotenv").config();

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err.message);
});

const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;

connectDB().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server ${PORT} portta başladı.`);
  });
});
