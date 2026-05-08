const request = require("supertest");
const { connectDB, client } = require("../config/db");
let app;

beforeAll(async () => {
  await connectDB();
  app = require("../app");
});

afterAll(async () => {
  await client.end();
});

describe("POST /users/login", () => {
  test("doğru kimlik bilgileriyle token döner", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ username: "test_admin", password: "admin123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe("test_admin");
    expect(res.body.user.password).toBeUndefined(); // şifre dönmemeli
  });

  test("yanlış şifre 401 döner", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ username: "test_admin", password: "yanlis_sifre" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("var olmayan kullanıcı 401 döner", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ username: "yok_kullanici", password: "sifre" });

    expect(res.status).toBe(401);
  });

  test("eksik username alanı 400 döner", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ password: "admin123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zorunlu/i);
  });

  test("eksik password alanı 400 döner", async () => {
    const res = await request(app)
      .post("/users/login")
      .send({ username: "test_admin" });

    expect(res.status).toBe(400);
  });
});

describe("Token doğrulama", () => {
  test("token olmadan korumalı endpoint 401 döner", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token gerekli");
  });

  test("geçersiz token 401 döner", async () => {
    const res = await request(app)
      .get("/users")
      .set("Authorization", "Bearer sahte.token.burada");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Geçersiz token");
  });

  test("geçerli token ile erişim sağlanır", async () => {
    const loginRes = await request(app)
      .post("/users/login")
      .send({ username: "test_admin", password: "admin123" });

    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
