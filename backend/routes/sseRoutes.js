const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { addClient, removeClient } = require("../utils/sse");

router.get("/", (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Token gerekli" });
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: "Geçersiz token" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write("event: connected\ndata: {}\n\n");

  addClient(res);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(res);
  });
});

module.exports = router;
