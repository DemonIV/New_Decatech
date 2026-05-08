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
  await client.query("DELETE FROM deadlines WHERE title LIKE 'Jest %'");
  await client.end();
});

describe("POST /deadlines", () => {
  test("geçerli deadline oluşturur", async () => {
    const res = await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest Deadline", due_date: "2026-12-31", assigned_role: "frontend" });

    expect(res.status).toBe(200);
  });

  test("başlık eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ due_date: "2026-12-31", assigned_role: "frontend" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zorunlu/i);
  });

  test("geçersiz tarih formatı 400 döner", async () => {
    const res = await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest Tarih", due_date: "31-12-2026", assigned_role: "backend" });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tarih/i);
  });

  test("rol eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest Rol", due_date: "2026-12-31" });

    expect(res.status).toBe(400);
  });
});

describe("GET /deadlines", () => {
  beforeAll(async () => {
    await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest Get Deadline", due_date: "2026-06-15", assigned_role: "design" });
  });

  test("admin tüm deadline'ları görür", async () => {
    const res = await request(app)
      .get("/deadlines?role=admin")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("role parametresiyle filtreler", async () => {
    const res = await request(app)
      .get("/deadlines?role=design")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.forEach((d) => expect(d.assigned_role).toBe("design"));
  });
});

describe("PUT /deadlines/:id", () => {
  let deadlineId;

  beforeAll(async () => {
    await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest Güncellenecek", due_date: "2026-08-01", assigned_role: "devops" });

    const list = await request(app)
      .get("/deadlines?role=admin")
      .set("Authorization", `Bearer ${token}`);
    const found = list.body.find((d) => d.title === "Jest Güncellenecek");
    deadlineId = found?.id;
  });

  test("tarihi günceller", async () => {
    const res = await request(app)
      .put(`/deadlines/${deadlineId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ due_date: "2026-09-30" });

    expect(res.status).toBe(200);
  });

  test("geçersiz tarih formatı 400 döner", async () => {
    const res = await request(app)
      .put(`/deadlines/${deadlineId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ due_date: "30/09/2026" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /deadlines/:id", () => {
  test("deadline'ı siler", async () => {
    await request(app)
      .post("/deadlines")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest Silinecek DL", due_date: "2026-11-11", assigned_role: "test_expert" });

    const list = await request(app)
      .get("/deadlines?role=admin")
      .set("Authorization", `Bearer ${token}`);
    const found = list.body.find((d) => d.title === "Jest Silinecek DL");

    const res = await request(app)
      .delete(`/deadlines/${found.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
