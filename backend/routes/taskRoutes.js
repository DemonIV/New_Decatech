const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { client } = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const VALID_COLS = ["todo", "doing", "done"];
const VALID_TAGS = ["pill-blue", "pill-violet", "pill-green", "pill-amber", "pill-red", "pill-cyan"];
const VALID_PRIOS = ["pill-green", "pill-amber", "pill-red"];

router.get(
  "/",
  auth,
  [query("project_id").optional().isInt({ min: 1 }).withMessage("Geçersiz project_id")],
  validate,
  async (req, res) => {
    const { project_id } = req.query;
    const baseQuery = `
      SELECT t.*, u.username AS assignee_username
      FROM tasks t
      LEFT JOIN users u ON t.assignee = u.id
    `;
    let result;
    if (project_id) {
      result = await client.query(
        baseQuery + "WHERE t.project_id=$1 ORDER BY t.created_at",
        [parseInt(project_id, 10)]
      );
    } else {
      result = await client.query(baseQuery + "ORDER BY t.created_at");
    }
    res.json(result.rows);
  }
);

router.post(
  "/",
  auth,
  [
    body("title").trim().notEmpty().withMessage("Başlık zorunlu")
      .isLength({ max: 200 }).withMessage("Başlık max 200 karakter"),
    body("col").optional().isIn(VALID_COLS).withMessage("Geçersiz sütun değeri"),
    body("tag").optional().isIn(VALID_TAGS).withMessage("Geçersiz etiket"),
    body("priority").optional().isIn(VALID_PRIOS).withMessage("Geçersiz öncelik"),
    body("assignee").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Geçersiz sorumlu ID"),
    body("project_id").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Geçersiz proje ID"),
    body("deadline").optional({ nullable: true }).isISO8601().withMessage("Geçersiz tarih formatı"),
  ],
  validate,
  async (req, res) => {
    const { title, description, col, tag, priority, assignee, project_id, created_by, deadline } = req.body;
    const result = await client.query(
      "INSERT INTO tasks (title, description, col, tag, priority, assignee, project_id, created_by, deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
      [
        title,
        description || null,
        col || "todo",
        tag || "pill-blue",
        priority || "pill-green",
        assignee ? parseInt(assignee, 10) : null,
        project_id || null,
        created_by || null,
        deadline || null,
      ]
    );
    res.json(result.rows[0]);
  }
);

router.put(
  "/:id",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz görev ID"),
    body("title").optional().trim().notEmpty().withMessage("Başlık boş olamaz")
      .isLength({ max: 200 }).withMessage("Başlık max 200 karakter"),
    body("col").optional().isIn(VALID_COLS).withMessage("Geçersiz sütun değeri"),
    body("tag").optional().isIn(VALID_TAGS).withMessage("Geçersiz etiket"),
    body("priority").optional().isIn(VALID_PRIOS).withMessage("Geçersiz öncelik"),
    body("assignee").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Geçersiz sorumlu ID"),
    body("deadline").optional({ nullable: true }).isISO8601().withMessage("Geçersiz tarih formatı"),
  ],
  validate,
  async (req, res) => {
    const { title, description, col, tag, priority, assignee, deadline } = req.body;
    const current = await client.query("SELECT * FROM tasks WHERE id=$1", [req.params.id]);
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
        assignee !== undefined ? (assignee ? parseInt(assignee, 10) : null) : task.assignee,
        deadline !== undefined ? deadline : task.deadline,
        req.params.id,
      ]
    );
    res.send("Güncellendi");
  }
);

router.put(
  "/:id/col",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz görev ID"),
    body("col").isIn(VALID_COLS).withMessage("Geçersiz sütun değeri"),
  ],
  validate,
  async (req, res) => {
    await client.query("UPDATE tasks SET col=$1 WHERE id=$2", [req.body.col, req.params.id]);
    res.send("Taşındı");
  }
);

router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Geçersiz görev ID")],
  validate,
  async (req, res) => {
    await client.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
    res.send("Silindi");
  }
);

module.exports = router;
