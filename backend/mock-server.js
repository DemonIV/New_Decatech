const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const toDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
};

let users = [
  { id: 1, username: "eren", name: "Ahmet Eren Akıner", email: "eren@decatech.local", password: "eren123", role: "admin", initials: "EA" },
  { id: 2, username: "sevket", name: "Şevket Yüksel", email: "sevket@decatech.local", password: "sevket123", role: "test uzmanı", initials: "SY" },
  { id: 3, username: "bugra", name: "Ahmet Buğra Keskin", email: "bugra@decatech.local", password: "bugra123", role: "scrum master", initials: "BK" },
  { id: 4, username: "samet", name: "Samet Karahan", email: "samet@decatech.local", password: "samet123", role: "raporlama sorumlusu", initials: "SK" },
  { id: 5, username: "cemilenur", name: "Cemilenur Tanrıseven", email: "cemilenur@decatech.local", password: "cemilenur123", role: "müşteri temsilcisi", initials: "CT" },
  { id: 6, username: "bekir", name: "Ebubekir Karakurt", email: "bekir@decatech.local", password: "bekir123", role: "backend", initials: "EK" },
  { id: 7, username: "cihan", name: "Cihan Taşdemir", email: "cihan@decatech.local", password: "cihan123", role: "backend", initials: "CI" },
  { id: 8, username: "safa", name: "Safa Aslan", email: "safa@decatech.local", password: "safa123", role: "frontend", initials: "SA" },
  { id: 9, username: "ismail", name: "İsmail Can", email: "ismail@decatech.local", password: "ismail123", role: "frontend", initials: "IC" },
  { id: 10, username: "alperen", name: "Alperen Torun", email: "alperen@decatech.local", password: "alperen123", role: "veri tabanı", initials: "AT" },
];

let projects = [
  { id: 1, name: "DECATECH Platform", color: "#2d5299", created_by: 1, created_at: toDate(-12) },
  { id: 2, name: "Mobil Uyum", color: "#8b5cf6", created_by: 1, created_at: toDate(-6) },
];

let userProjects = [
  { user_id: 2, project_id: 1 },
  { user_id: 3, project_id: 1 },
  { user_id: 4, project_id: 1 },
  { user_id: 5, project_id: 1 },
  { user_id: 6, project_id: 1 },
  { user_id: 7, project_id: 1 },
  { user_id: 8, project_id: 1 },
  { user_id: 9, project_id: 1 },
  { user_id: 10, project_id: 1 },
  { user_id: 8, project_id: 2 },
  { user_id: 9, project_id: 2 },
];

let tasks = [];

let deadlines = [];

const publicUser = ({ password, ...user }) => user;
const nextId = (items) => Math.max(0, ...items.map((item) => item.id)) + 1;

app.get("/health", (req, res) => {
  res.json({ success: true, service: "decatech-mock-api", database: "mock" });
});

app.post("/users/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => (u.username === username || u.email === username) && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: "Hatalı giriş" });
  }

  res.json({ success: true, user: publicUser(user) });
});

app.get("/users/roles/all", (req, res) => {
  res.json([...new Set(users.map((user) => user.role))].sort());
});

app.get("/users", (req, res) => {
  res.json(users.map(publicUser).sort((a, b) => a.id - b.id));
});

app.post("/users", (req, res) => {
  const { username, name, email, password, role } = req.body;
  const initials = (name || username || "U").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const user = { id: nextId(users), username, name, email, password, role: role || "user", initials };
  users.push(user);

  res.status(201).json(publicUser(user));
});

app.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((item) => item.id === id);
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
  if (user.role === "admin") return res.status(400).json({ success: false, message: "Admin kullanıcı silinemez" });

  const initials = String(user.initials || "").toUpperCase();
  users = users.filter((user) => user.id !== id);
  userProjects = userProjects.filter((item) => item.user_id !== id);
  tasks = tasks.map((task) => String(task.assignee || "").toUpperCase() === initials ? { ...task, assignee: "" } : task);

  res.json({ success: true, message: "Silindi" });
});

app.put("/users/:id/password", (req, res) => {
  const user = users.find((item) => item.id === Number(req.params.id));
  if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });

  user.password = req.body.password;
  res.json({ success: true, message: "Şifre güncellendi" });
});

app.get("/users/:id/projects", (req, res) => {
  const userId = Number(req.params.id);
  const projectIds = userProjects.filter((item) => item.user_id === userId).map((item) => item.project_id);

  res.json(projects.filter((project) => projectIds.includes(project.id)));
});

app.post("/users/:id/projects", (req, res) => {
  const userId = Number(req.params.id);
  const projectId = Number(req.body.project_id);
  const exists = userProjects.some((item) => item.user_id === userId && item.project_id === projectId);

  if (!exists) userProjects.push({ user_id: userId, project_id: projectId });

  res.json({ success: true, message: "Eklendi" });
});

app.delete("/users/:id/projects/:pid", (req, res) => {
  const userId = Number(req.params.id);
  const projectId = Number(req.params.pid);
  userProjects = userProjects.filter((item) => item.user_id !== userId || item.project_id !== projectId);

  res.json({ success: true, message: "Çıkarıldı" });
});

app.get("/projects", (req, res) => {
  res.json(projects.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
});

app.post("/projects", (req, res) => {
  const { name, color, created_by } = req.body;
  const project = {
    id: nextId(projects),
    name,
    color: color || "#2d5299",
    created_by: created_by || null,
    created_at: toDate(0),
  };

  projects.push(project);
  if (created_by) userProjects.push({ user_id: created_by, project_id: project.id });

  res.json(project);
});

app.delete("/projects/:id", (req, res) => {
  const id = Number(req.params.id);
  projects = projects.filter((project) => project.id !== id);
  tasks = tasks.filter((task) => task.project_id !== id);
  userProjects = userProjects.filter((item) => item.project_id !== id);

  res.send("Silindi");
});

app.get("/tasks", (req, res) => {
  const projectId = req.query.project_id ? Number(req.query.project_id) : null;
  const result = projectId ? tasks.filter((task) => task.project_id === projectId) : tasks;

  res.json(result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
});

app.post("/tasks", (req, res) => {
  const task = {
    id: nextId(tasks),
    title: req.body.title,
    description: req.body.description || null,
    col: req.body.col || "todo",
    tag: req.body.tag || "pill-blue",
    priority: req.body.priority || "pill-green",
    assignee: req.body.assignee || null,
    project_id: req.body.project_id || null,
    created_by: req.body.created_by || null,
    created_at: toDate(0),
    deadline: req.body.deadline || null,
  };

  tasks.push(task);
  res.json(task);
});

app.put("/tasks/:id", (req, res) => {
  const task = tasks.find((item) => item.id === Number(req.params.id));
  if (!task) return res.status(404).json({ success: false, message: "Görev bulunamadı" });

  Object.assign(task, {
    title: req.body.title ?? task.title,
    description: req.body.description ?? task.description,
    col: req.body.col ?? task.col,
    tag: req.body.tag ?? task.tag,
    priority: req.body.priority ?? task.priority,
    assignee: req.body.assignee ?? task.assignee,
    deadline: req.body.deadline !== undefined ? req.body.deadline : task.deadline,
  });

  res.send("Güncellendi");
});

app.put("/tasks/:id/col", (req, res) => {
  const task = tasks.find((item) => item.id === Number(req.params.id));
  if (!task) return res.status(404).json({ success: false, message: "Görev bulunamadı" });

  task.col = req.body.col;
  res.send("Taşındı");
});

app.delete("/tasks/:id", (req, res) => {
  tasks = tasks.filter((task) => task.id !== Number(req.params.id));

  res.send("Silindi");
});

app.get("/deadlines", (req, res) => {
  const { role } = req.query;
  const result = role === "admin" || !role
    ? deadlines
    : deadlines.filter((deadline) => deadline.assigned_role === role);

  res.json(result.sort((a, b) => new Date(a.due_date) - new Date(b.due_date)));
});

app.post("/deadlines", (req, res) => {
  deadlines.push({
    id: nextId(deadlines),
    title: req.body.title,
    description: req.body.description || null,
    due_date: req.body.due_date,
    assigned_role: req.body.assigned_role,
    created_by: req.body.created_by || null,
    created_at: toDate(0),
  });

  res.send("Deadline eklendi");
});

app.put("/deadlines/:id", (req, res) => {
  const deadline = deadlines.find((item) => item.id === Number(req.params.id));
  if (!deadline) return res.status(404).json({ success: false, message: "Deadline bulunamadı" });

  deadline.due_date = req.body.due_date;
  res.send("Güncellendi");
});

app.delete("/deadlines/:id", (req, res) => {
  deadlines = deadlines.filter((deadline) => deadline.id !== Number(req.params.id));

  res.send("Silindi");
});

app.listen(PORT, () => {
  console.log(`Mock API ${PORT} portta başladı.`);
  console.log("Demo login: eren / eren123");
});
