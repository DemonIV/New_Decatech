const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { client } = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

router.get("/", auth, async (req, res, next) => {
  try {
    const result = await client.query("SELECT * FROM projects ORDER BY created_at");
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post(
  "/",
  auth,
  [
    body("name").trim().notEmpty().withMessage("Proje adı zorunlu").isLength({ max: 100 }).withMessage("Proje adı max 100 karakter"),
    body("color").optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage("Geçersiz renk formatı (#rrggbb)"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, color, created_by } = req.body;
      const result = await client.query(
        "INSERT INTO projects (name, color, created_by) VALUES ($1,$2,$3) RETURNING *",
        [name, color || "#2d5299", created_by || null]
      );
      res.json(result.rows[0]);
    } catch (err) { next(err); }
  }
);

router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Geçersiz proje ID")],
  validate,
  async (req, res, next) => {
    try {
      await client.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
      res.send("Silindi");
    } catch (err) { next(err); }
  }
);

module.exports = router;
