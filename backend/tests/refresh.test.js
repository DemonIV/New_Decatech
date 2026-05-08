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

async function login(username = "test_admin", password = "admin123") {
  const res = await request(app).post("/users/login").send({ username, password });
  return res.body;
}

describe("POST /users/refresh", () => {
  test("geçerli refresh token ile yeni access token alınır", async () => {
    const { refreshToken } = await login();
    const res = await request(app)
      .post("/users/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
  });

  test("geçersiz refresh token 401 döner", async () => {
    const res = await request(app)
      .post("/users/refresh")
      .send({ refreshToken: "gecersiz-token-xyz" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("refresh token eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/users/refresh")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zorunlu/i);
  });

  test("refresh sonrası alınan yeni token ile korumalı endpoint'e erişilir", async () => {
    const { refreshToken } = await login();
    const refreshRes = await request(app)
      .post("/users/refresh")
      .send({ refreshToken });

    const newToken = refreshRes.body.token;
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${newToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /users/logout", () => {
  test("logout refresh token'ı geçersiz kılar", async () => {
    const { refreshToken } = await login();

    const logoutRes = await request(app)
      .post("/users/logout")
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // logout sonrası aynı token ile refresh yapılamaz
    const refreshRes = await request(app)
      .post("/users/refresh")
      .send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });

  test("var olmayan token ile logout yine 200 döner", async () => {
    const res = await request(app)
      .post("/users/logout")
      .send({ refreshToken: "yok-olan-token" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("refresh token eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/users/logout")
      .send({});

    expect(res.status).toBe(400);
  });
});
