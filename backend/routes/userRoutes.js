const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { client } = require("../config/db");
const auth = require("../middleware/auth");

const SALT_ROUNDS = 10;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

// 🔹 Kullanıcı ekle
router.post("/", auth, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Kullanıcı adı ve şifre zorunlu",
      });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await client.query(
      "INSERT INTO users (username, password, role) VALUES ($1,$2,$3) RETURNING id, username, role",
      [username, hash, role || "user"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(503).json({ success: false, message: "Kullanıcı eklenemedi" });
  }
});

// 🔹 LOGIN (public)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await client.query(
      "SELECT id, username, role, password FROM users WHERE username=$1",
      [username]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "Hatalı giriş" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Hatalı giriş" });
    }

    const { password: _, ...safeUser } = user;
    const token = signToken(safeUser);

    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(503).json({ success: false, message: "Login hatası" });
  }
});

// 🔹 TÜM USERS
router.get("/", auth, async (req, res) => {
  try {
    const result = await client.query(
      "SELECT id, username, role FROM users ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(503).json({ success: false, message: "Liste hatası" });
  }
});

// 🔹 USER SİL
router.delete("/:id", auth, async (req, res) => {
  try {
    await client.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true, message: "Silindi" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Silme hatası" });
  }
});

// 🔹 ROLE GÜNCELLE
router.put("/:id/role", auth, async (req, res) => {
  try {
    const { role } = req.body;
    await client.query("UPDATE users SET role=$1 WHERE id=$2", [role, req.params.id]);
    res.json({ success: true, message: "Rol güncellendi" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Güncelleme hatası" });
  }
});

// 🔹 PASSWORD GÜNCELLE
router.put("/:id/password", auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Şifre boş olamaz" });
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await client.query("UPDATE users SET password=$1 WHERE id=$2", [hash, req.params.id]);
    res.json({ success: true, message: "Şifre güncellendi" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hata" });
  }
});

// 🔹 USER PROJECTS GET
router.get("/:id/projects", auth, async (req, res) => {
  try {
    const result = await client.query(
      "SELECT p.* FROM projects p JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = $1",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ success: false, message: "Hata" });
  }
});

// 🔹 USER PROJECT EKLE
router.post("/:id/projects", auth, async (req, res) => {
  try {
    const { project_id } = req.body;
    await client.query(
      "INSERT INTO user_projects (user_id, project_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [req.params.id, project_id]
    );
    res.json({ success: true, message: "Eklendi" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hata" });
  }
});

// 🔹 USER PROJECT SİL
router.delete("/:id/projects/:pid", auth, async (req, res) => {
  try {
    await client.query(
      "DELETE FROM user_projects WHERE user_id=$1 AND project_id=$2",
      [req.params.id, req.params.pid]
    );
    res.json({ success: true, message: "Çıkarıldı" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Hata" });
  }
});

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
