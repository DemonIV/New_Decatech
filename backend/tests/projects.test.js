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
  await client.query("DELETE FROM projects WHERE name LIKE 'Jest %'");
  await client.end();
});

describe("GET /projects", () => {
  test("proje listesi döner", async () => {
    const res = await request(app)
      .get("/projects")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("token olmadan 401 döner", async () => {
    const res = await request(app).get("/projects");
    expect(res.status).toBe(401);
  });
});

describe("POST /projects", () => {
  test("geçerli proje oluşturur", async () => {
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Jest Test Projesi", color: "#ff5500" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Jest Test Projesi");
    expect(res.body.color).toBe("#ff5500");
    expect(res.body.id).toBeDefined();
  });

  test("isim eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#ff5500" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zorunlu/i);
  });

  test("geçersiz hex rengi 400 döner", async () => {
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Jest Renk Test", color: "kirmizi" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/#rrggbb/i);
  });

  test("renk olmadan varsayılan renk atanır", async () => {
    const res = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Jest Varsayılan Renk" });

    expect(res.status).toBe(200);
    expect(res.body.color).toBe("#2d5299");
  });
});

describe("DELETE /projects/:id", () => {
  test("projeyi siler", async () => {
    const created = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Jest Silinecek Proje" });

    const res = await request(app)
      .delete(`/projects/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  test("geçersiz ID 400 döner", async () => {
    const res = await request(app)
      .delete("/projects/abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
