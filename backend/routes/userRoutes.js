const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, param } = require("express-validator");
const { client } = require("../config/db");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const SALT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

// 🔹 Kullanıcı ekle
router.post(
  "/",
  auth,
  [
    body("username").trim().notEmpty().withMessage("Kullanıcı adı zorunlu")
      .isLength({ max: 50 }).withMessage("Kullanıcı adı max 50 karakter"),
    body("password").isLength({ min: 6 }).withMessage("Şifre en az 6 karakter olmalı"),
    body("role").optional().isLength({ max: 20 }).withMessage("Rol max 20 karakter"),
  ],
  validate,
  async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      const result = await client.query(
        "INSERT INTO users (username, password, role) VALUES ($1,$2,$3) RETURNING id, username, role",
        [username, hash, role || "user"]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === "23505") {
        return res.status(409).json({ success: false, message: "Bu kullanıcı adı zaten alınmış" });
      }
      res.status(503).json({ success: false, message: "Kullanıcı eklenemedi" });
    }
  }
);

// 🔹 LOGIN (public)
router.post(
  "/login",
  [
    body("username").trim().notEmpty().withMessage("Kullanıcı adı zorunlu"),
    body("password").notEmpty().withMessage("Şifre zorunlu"),
  ],
  validate,
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await client.query(
        "SELECT id, username, role, password FROM users WHERE username=$1",
        [username]
      );
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: "Hatalı giriş" });
      }
      const { password: _, ...safeUser } = user;
      res.json({ success: true, token: signToken(safeUser), user: safeUser });
    } catch (err) {
      res.status(503).json({ success: false, message: "Login hatası" });
    }
  }
);

// 🔹 TÜM USERS
router.get("/", auth, async (req, res) => {
  try {
    const result = await client.query("SELECT id, username, role FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(503).json({ success: false, message: "Liste hatası" });
  }
});

// 🔹 USER SİL
router.delete(
  "/:id",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Geçersiz kullanıcı ID")],
  validate,
  async (req, res) => {
    try {
      await client.query("DELETE FROM users WHERE id=$1", [req.params.id]);
      res.json({ success: true, message: "Silindi" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Silme hatası" });
    }
  }
);

// 🔹 ROLE GÜNCELLE
router.put(
  "/:id/role",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz kullanıcı ID"),
    body("role").trim().notEmpty().withMessage("Rol zorunlu")
      .isLength({ max: 20 }).withMessage("Rol max 20 karakter"),
  ],
  validate,
  async (req, res) => {
    try {
      await client.query("UPDATE users SET role=$1 WHERE id=$2", [req.body.role, req.params.id]);
      res.json({ success: true, message: "Rol güncellendi" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Güncelleme hatası" });
    }
  }
);

// 🔹 PASSWORD GÜNCELLE
router.put(
  "/:id/password",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz kullanıcı ID"),
    body("password").isLength({ min: 6 }).withMessage("Şifre en az 6 karakter olmalı"),
  ],
  validate,
  async (req, res) => {
    try {
      const hash = await bcrypt.hash(req.body.password, SALT_ROUNDS);
      await client.query("UPDATE users SET password=$1 WHERE id=$2", [hash, req.params.id]);
      res.json({ success: true, message: "Şifre güncellendi" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Hata" });
    }
  }
);

// 🔹 USER PROJECTS GET
router.get(
  "/:id/projects",
  auth,
  [param("id").isInt({ min: 1 }).withMessage("Geçersiz kullanıcı ID")],
  validate,
  async (req, res) => {
    try {
      const result = await client.query(
        "SELECT p.* FROM projects p JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = $1",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ success: false, message: "Hata" });
    }
  }
);

// 🔹 USER PROJECT EKLE
router.post(
  "/:id/projects",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz kullanıcı ID"),
    body("project_id").isInt({ min: 1 }).withMessage("Geçersiz proje ID"),
  ],
  validate,
  async (req, res) => {
    try {
      await client.query(
        "INSERT INTO user_projects (user_id, project_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [req.params.id, req.body.project_id]
      );
      res.json({ success: true, message: "Eklendi" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Hata" });
    }
  }
);

// 🔹 USER PROJECT SİL
router.delete(
  "/:id/projects/:pid",
  auth,
  [
    param("id").isInt({ min: 1 }).withMessage("Geçersiz kullanıcı ID"),
    param("pid").isInt({ min: 1 }).withMessage("Geçersiz proje ID"),
  ],
  validate,
  async (req, res) => {
    try {
      await client.query(
        "DELETE FROM user_projects WHERE user_id=$1 AND project_id=$2",
        [req.params.id, req.params.pid]
      );
      res.json({ success: true, message: "Çıkarıldı" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Hata" });
    }
  }
);

// 🔹 ROLE LİSTESİ
router.get("/roles/all", auth, async (req, res) => {
  try {
    const result = await client.query("SELECT DISTINCT role FROM users ORDER BY role");
    res.json(result.rows.map((r) => r.role));
  } catch (err) {
    res.status(500).json({ success: false, message: "Hata" });
  }
});

module.exports = router;
