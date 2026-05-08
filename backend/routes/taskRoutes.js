const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const { client } = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const VALID_COLS  = ["todo", "doing", "done"];
const VALID_TAGS  = ["pill-blue", "pill-violet", "pill-green", "pill-amber", "pill-red", "pill-cyan"];
const VALID_PRIOS = ["pill-green", "pill-amber", "pill-red"];

router.get(
  "/",
  auth,
  [query("project_id").optional().isInt({ min: 1 }).withMessage("Geçersiz project_id")],
  validate,
  async (req, res, next) => {
    try {
      const { project_id } = req.query;
      const base = `
        SELECT t.*, u.username AS assignee_username
        FROM tasks t LEFT JOIN users u ON t.assignee = u.id
      `;
      const result = project_id
        ? await client.query(base + "WHERE t.project_id=$1 ORDER BY t.created_at", [parseInt(project_id, 10)])
        : await client.query(base + "ORDER BY t.created_at");
      res.json(result.rows);
    } catch (err) { next(err); }
  }
);

router.post(
  "/",
  auth,
  [
    body("title").trim().notEmpty().withMessage("Başlık zorunlu").isLength({ max: 200 }).withMessage("Başlık max 200 karakter"),
    body("col").optional().isIn(VALID_COLS).withMessage("Geçersiz sütun değeri"),
    body("tag").optional().isIn(VALID_TAGS).withMessage("Geçersiz etiket"),
    body("priority").optional().isIn(VALID_PRIOS).withMessage("Geçersiz öncelik"),
    body("assignee").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Geçersiz sorumlu ID"),
    body("project_id").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Geçersiz proje ID"),
    body("deadline").optional({ nullable: true }).isISO8601().withMessage("Geçersiz tarih formatı"),
  ],
  validate,
  async (req, res, next) => {
    try {
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
    } catch (err) { next(err); }
  }
);

router.put(
  "/:id",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz görev ID"),
    body("title").optional().trim().notEmpty().withMessage("Başlık boş olamaz").isLength({ max: 200 }).withMessage("Başlık max 200 karakter"),
    body("col").optional().isIn(VALID_COLS).withMessage("Geçersiz sütun değeri"),
    body("tag").optional().isIn(VALID_TAGS).withMessage("Geçersiz etiket"),
    body("priority").optional().isIn(VALID_PRIOS).withMessage("Geçersiz öncelik"),
    body("assignee").optional({ nullable: true }).isInt({ min: 1 }).withMessage("Geçersiz sorumlu ID"),
    body("deadline").optional({ nullable: true }).isISO8601().withMessage("Geçersiz tarih formatı"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, col, tag, priority, assignee, deadline } = req.body;
      const { rows } = await client.query("SELECT * FROM tasks WHERE id=$1", [req.params.id]);
      if (!rows[0]) return res.status(404).json({ success: false, message: "Görev bulunamadı" });
      const t = rows[0];
      await client.query(
        "UPDATE tasks SET title=$1, description=$2, col=$3, tag=$4, priority=$5, assignee=$6, deadline=$7 WHERE id=$8",
        [
          title ?? t.title,
          description ?? t.description,
          col ?? t.col,
          tag ?? t.tag,
          priority ?? t.priority,
          assignee !== undefined ? (assignee ? parseInt(assignee, 10) : null) : t.assignee,
          deadline !== undefined ? deadline : t.deadline,
          req.params.id,
        ]
      );
      res.send("Güncellendi");
    } catch (err) { next(err); }
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
  async (req, res, next) => {
    try {
      await client.query("UPDATE tasks SET col=$1 WHERE id=$2", [req.body.col, req.params.id]);
      res.send("Taşındı");
    } catch (err) { next(err); }
  }
);

router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Geçersiz görev ID")],
  validate,
  async (req, res, next) => {
    try {
      await client.query("DELETE FROM tasks WHERE id=$1", [req.params.id]);
      res.send("Silindi");
    } catch (err) { next(err); }
  }
);

module.exports = router;
