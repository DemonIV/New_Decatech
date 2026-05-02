const express = require("express");
const router = express.Router();
const { client } = require("../config/db");

router.get("/", async (req, res) => {
  const { project_id } = req.query;
  let result;

  if (project_id) {
    const id = parseInt(project_id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Geçersiz project_id" });
    }

    result = await client.query(
      "SELECT * FROM tasks WHERE project_id=$1 ORDER BY created_at",
      [id]
    );
  } else {
    result = await client.query("SELECT * FROM tasks ORDER BY created_at");
  }

  res.json(result.rows);
});

router.post("/", async (req, res) => {
  const {
    title,
    description,
    col,
    tag,
    priority,
    assignee,
    project_id,
    created_by,
    deadline,
  } = req.body;

  const result = await client.query(
    "INSERT INTO tasks (title, description, col, tag, priority, assignee, project_id, created_by, deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
    [
      title,
      description || null,
      col || "todo",
      tag || "pill-blue",
      priority || "pill-green",
      assignee || null,
      project_id || null,
      created_by || null,
      deadline || null,
    ]
  );

  res.json(result.rows[0]);
});

router.put("/:id", async (req, res) => {
  const { title, description, col, tag, priority, assignee, deadline } = req.body;

  const current = await client.query("SELECT * FROM tasks WHERE id=$1", [
    req.params.id,
  ]);
  const task = current.rows[0];

  if (!task) {
    return res.status(404).json({ success: false, message: "Görev bulunamadı" });
  }

  await client.query(
    "UPDATE tasks SET title=$1, description=$2, col=$3, tag=$4, priority=$5, assignee=$6, deadline=$7 WHERE id=$8",
    [
      title ?? task.title,
      description ?? task.description,
      col ?? task.col,
      tag ?? task.tag,
      priority ?? task.priority,
      assignee ?? task.assignee,
      deadline !== undefined ? deadline : task.deadline,
      req.params.id,
    ]
  );

  res.send("Güncellendi");
});

router.put("/:id/col", async (req, res) => {
  const { col } = req.body;

  await client.query("UPDATE tasks SET col=$1 WHERE id=$2", [col, req.params.id]);

  res.send("Taşındı");
});

router.delete("/:id", async (req, res) => {
  await client.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);

  res.send("Silindi");
});

module.exports = router;
