const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const { client } = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

router.post(
  "/",
  auth,
  [
    body("title").trim().notEmpty().withMessage("Başlık zorunlu").isLength({ max: 100 }).withMessage("Başlık max 100 karakter"),
    body("due_date").isISO8601().withMessage("Geçersiz tarih formatı"),
    body("assigned_role").trim().notEmpty().withMessage("Rol zorunlu").isLength({ max: 20 }).withMessage("Rol max 20 karakter"),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, due_date, assigned_role, created_by } = req.body;
      await client.query(
        "INSERT INTO deadlines (title, description, due_date, assigned_role, created_by) VALUES ($1,$2,$3,$4,$5)",
        [title, description || null, due_date, assigned_role, created_by || null]
      );
      res.send("Deadline eklendi");
    } catch (err) { next(err); }
  }
);

router.get("/", auth, async (req, res, next) => {
  try {
    const { role } = req.query;
    const result = role === "admin"
      ? await client.query("SELECT * FROM deadlines ORDER BY due_date")
      : await client.query("SELECT * FROM deadlines WHERE assigned_role=$1 ORDER BY due_date", [role || ""]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Geçersiz deadline ID")],
  validate,
  async (req, res, next) => {
    try {
      await client.query("DELETE FROM deadlines WHERE id=$1", [req.params.id]);
      res.send("Silindi");
    } catch (err) { next(err); }
  }
);

router.put(
  "/:id",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz deadline ID"),
    body("due_date").isISO8601().withMessage("Geçersiz tarih formatı"),
  ],
  validate,
  async (req, res, next) => {
    try {
      await client.query("UPDATE deadlines SET due_date=$1 WHERE id=$2", [req.body.due_date, req.params.id]);
      res.send("Güncellendi");
    } catch (err) { next(err); }
  }
);

module.exports = router;
