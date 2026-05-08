const request = require("supertest");
const { connectDB, client } = require("../config/db");
const getToken = require("./helpers/getToken");
let app, token;

beforeAll(async () => {
  await connectDB();
  app   = require("../app");
  token = await getToken(app);
});

afterAll(async () => {
  await client.query("DELETE FROM users WHERE username LIKE 'jest_%'");
  await client.end();
});

describe("GET /users", () => {
  test("tüm kullanıcıları listeler, şifre dönmez", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((u) => expect(u.password).toBeUndefined());
  });
});

describe("POST /users", () => {
  test("yeni kullanıcı oluşturur", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "jest_newuser", password: "sifre123", role: "user" });

    expect(res.status).toBe(201);
    expect(res.body.username).toBe("jest_newuser");
    expect(res.body.password).toBeUndefined();
  });

  test("aynı username ile 409 döner", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "jest_newuser", password: "baska123" });

    expect(res.status).toBe(409);
  });

  test("şifre 6 karakterden kısa ise 400 döner", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "jest_kisa", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/6 karakter/);
  });

  test("username eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "sifre123" });

    expect(res.status).toBe(400);
  });
});

describe("PUT /users/:id/role", () => {
  test("kullanıcı rolünü günceller", async () => {
    // Önce kullanıcı oluştur
    const created = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "jest_role_user", password: "sifre123", role: "user" });

    const res = await request(app)
      .put(`/users/${created.body.id}/role`)
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "frontend" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("geçersiz ID ile 400 döner", async () => {
    const res = await request(app)
      .put("/users/abc/role")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "user" });

    expect(res.status).toBe(400);
  });
});

describe("PUT /users/:id/password", () => {
  test("şifreyi günceller ve yeni şifre ile login olunur", async () => {
    const created = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "jest_pw_user", password: "eski123", role: "user" });

    await request(app)
      .put(`/users/${created.body.id}/password`)
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "yeni123456" });

    // Eski şifre artık çalışmamalı
    const oldLogin = await request(app)
      .post("/users/login")
      .send({ username: "jest_pw_user", password: "eski123" });
    expect(oldLogin.status).toBe(401);

    // Yeni şifre çalışmalı
    const newLogin = await request(app)
      .post("/users/login")
      .send({ username: "jest_pw_user", password: "yeni123456" });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.token).toBeDefined();
  });
});

describe("DELETE /users/:id", () => {
  test("kullanıcıyı siler", async () => {
    const created = await request(app)
      .post("/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "jest_delete_user", password: "sifre123" });

    const res = await request(app)
      .delete(`/users/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
