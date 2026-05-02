const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

router.get("/", async (req, res) => {
  const result = await client.query("SELECT * FROM projects ORDER BY created_at");

  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const { name, color, created_by } = req.body;

  const result = await client.query(
    "INSERT INTO projects (name, color, created_by) VALUES ($1,$2,$3) RETURNING *",
    [name, color || "#2d5299", created_by || null]
  );

  res.json(result.rows[0]);
});

router.delete("/:id", async (req, res) => {
  await client.query("DELETE FROM projects WHERE id=$1", [req.params.id]);

  res.send("Silindi");
});

module.exports = router;
