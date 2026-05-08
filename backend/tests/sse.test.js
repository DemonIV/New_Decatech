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

async function getToken(username = "test_admin", password = "admin123") {
  const res = await request(app).post("/users/login").send({ username, password });
  return res.body.token;
}

describe("GET /events (SSE auth)", () => {
  test("token olmadan 401 döner", async () => {
    const res = await request(app).get("/events");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/token/i);
  });

  test("geçersiz token 401 döner", async () => {
    const res = await request(app).get("/events?token=sahte.token.xyz");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/geçersiz/i);
  });

  test("geçerli token Content-Type: text/event-stream döner", async () => {
    const token = await getToken();
    await new Promise((resolve) => {
      const req = request(app)
        .get(`/events?token=${encodeURIComponent(token)}`)
        .set("Accept", "text/event-stream")
        .buffer(false)
        .parse((res, _cb) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
          res.destroy();
          resolve();
        });
      req.end();
    });
  });
});
