/**
 * Migration 002: Mevcut plain-text şifreleri bcrypt ile hashle
 * Çalıştır: node migrations/002_hash_passwords.js
 *
 * Gereksinim: backend/.env dosyasının dolu olması
 */

require("dotenv").config({ path: "./backend/.env" });
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const client = new Client({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "taskapp",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});

(async () => {
  await client.connect();
  console.log("DB bağlı, şifreler hashleniyor...\n");

  const { rows: users } = await client.query("SELECT id, username, password FROM users");

  let updated = 0;
  for (const user of users) {
    // Zaten hashlenmiş şifreleri atla ($2a$ = bcrypt prefix)
    if (user.password.startsWith("$2")) {
      console.log(`  [SKIP] ${user.username} (zaten hashlenmiş)`);
      continue;
    }
    const hash = await bcrypt.hash(user.password, 10);
    await client.query("UPDATE users SET password=$1 WHERE id=$2", [hash, user.id]);
    console.log(`  [OK]   ${user.username} → hashli`);
    updated++;
  }

  console.log(`\n✓ Tamamlandı: ${updated} şifre hashlendi.`);
  await client.end();
})();
