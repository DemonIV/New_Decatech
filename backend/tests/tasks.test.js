const request = require("supertest");
const { connectDB, client } = require("../config/db");
const getToken = require("./helpers/getToken");
let app, token, projectId;

beforeAll(async () => {
  await connectDB();
  app   = require("../app");
  token = await getToken(app);

  // Testler için bir proje oluştur
  const proj = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Jest Task Projesi", color: "#0f4578" });
  projectId = proj.body.id;
});

afterAll(async () => {
  await client.query("DELETE FROM projects WHERE name = 'Jest Task Projesi'");
  await client.end();
});

describe("POST /tasks", () => {
  test("geçerli görev oluşturur", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest görevi", col: "todo", tag: "pill-blue", priority: "pill-green", project_id: projectId });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Jest görevi");
    expect(res.body.col).toBe("todo");
    expect(res.body.id).toBeDefined();
  });

  test("başlık eksikse 400 döner", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ col: "todo", project_id: projectId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/zorunlu/i);
  });

  test("geçersiz col değeri 400 döner", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest", col: "yanlis_sutun", project_id: projectId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/sütun/i);
  });

  test("geçersiz tarih formatı 400 döner", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest", deadline: "31-12-2025", project_id: projectId });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/tarih/i);
  });

  test("geçersiz priority 400 döner", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Jest", priority: "pill-purple", project_id: projectId });

    expect(res.status).toBe(400);
  });
});

describe("GET /tasks", () => {
  test("tüm görevleri listeler", async () => {
    const res = await request(app)
      .get("/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("project_id ile filtreler", async () => {
    const res = await request(app)
      .get(`/tasks?project_id=${projectId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.forEach((t) => expect(t.project_id).toBe(projectId));
  });

  test("geçersiz project_id 400 döner", async () => {
    const res = await request(app)
      .get("/tasks?project_id=abc")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe("PUT /tasks/:id", () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Güncellenecek görev", col: "todo", project_id: projectId });
    taskId = res.body.id;
  });

  test("görevi günceller", async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Güncellenmiş başlık", col: "doing" });

    expect(res.status).toBe(200);
  });

  test("var olmayan görev 404 döner", async () => {
    const res = await request(app)
      .put("/tasks/99999")
      .set("Authorization", `Bearer ${token}`)
      .send({ col: "done" });

    expect(res.status).toBe(404);
  });
});

describe("PUT /tasks/:id/col", () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Taşınacak görev", col: "todo", project_id: projectId });
    taskId = res.body.id;
  });

  test("görevi sütuna taşır", async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}/col`)
      .set("Authorization", `Bearer ${token}`)
      .send({ col: "done" });

    expect(res.status).toBe(200);
  });

  test("geçersiz col 400 döner", async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}/col`)
      .set("Authorization", `Bearer ${token}`)
      .send({ col: "bitti" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /tasks/:id", () => {
  test("görevi siler", async () => {
    const created = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Silinecek görev", col: "todo", project_id: projectId });

    const res = await request(app)
      .delete(`/tasks/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
