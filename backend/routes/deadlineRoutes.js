const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

router.post("/", async (req, res) => {
  const { title, description, due_date, assigned_role, created_by } = req.body;

  await client.query(
    "INSERT INTO deadlines (title, description, due_date, assigned_role, created_by) VALUES ($1,$2,$3,$4,$5)",
    [title, description || null, due_date, assigned_role, created_by || null]
  );

  res.send("Deadline eklendi");
});

router.get("/", async (req, res) => {
  const { role } = req.query;
  let result;

  if (role === "admin") {
    result = await client.query("SELECT * FROM deadlines ORDER BY due_date");
  } else {
    result = await client.query(
      "SELECT * FROM deadlines WHERE assigned_role=$1 ORDER BY due_date",
      [role]
    );
  }

  res.json(result.rows);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  await client.query("DELETE FROM deadlines WHERE id=$1", [id]);

  res.send("Silindi");
});

router.put("/:id", async (req, res) => {
  const { due_date } = req.body;

  await client.query("UPDATE deadlines SET due_date=$1 WHERE id=$2", [
    due_date,
    req.params.id,
  ]);

  res.send("Güncellendi");
});

module.exports = router;
