const express = require("express");
const cors = require("cors");

const dbCheck = require("./middleware/dbCheck");
const { client } = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const { connectDB } = require("./config/db");


const app = express();

app.use(cors());
app.use(express.json());

// DB BAĞLANTISI VE CHECK MIDDLEWARE
connectDB();
app.use(dbCheck);

// 🔥 USER ROUTES BAĞLADIK
app.use("/users", userRoutes);

// ── DEADLINES ──

// Deadline ekle
app.post('/deadlines', async (req, res) => {
  const { title, description, due_date, assigned_role, created_by } = req.body;
  await client.query(
    'INSERT INTO deadlines (title, description, due_date, assigned_role, created_by) VALUES ($1,$2,$3,$4,$5)',
    [title, description || null, due_date, assigned_role, created_by || null]
  );
  res.send('Deadline eklendi');
});

// Role göre deadlineları getir
app.get('/deadlines', async (req, res) => {
  const { role } = req.query;
  let result;
  if (role === 'admin') {
    result = await client.query('SELECT * FROM deadlines ORDER BY due_date');
  } else {
    result = await client.query(
      'SELECT * FROM deadlines WHERE assigned_role=$1 ORDER BY due_date',
      [role]
    );
  }
  res.json(result.rows);
});

// Deadline sil
app.delete('/deadlines/:id', async (req, res) => {
  const { id } = req.params;
  await client.query('DELETE FROM deadlines WHERE id=$1', [id]);
  res.send('Silindi');
});

// Deadline güncelle
app.put('/deadlines/:id', async (req, res) => {
  const { due_date } = req.body;
  await client.query('UPDATE deadlines SET due_date=$1 WHERE id=$2', [due_date, req.params.id]);
  res.send('Güncellendi');
});

// ── PROJECTS ──

app.get('/projects', async (req, res) => {
  const result = await client.query('SELECT * FROM projects ORDER BY created_at');
  res.json(result.rows);
});

app.post('/projects', async (req, res) => {
  const { name, color, created_by } = req.body;
  const result = await client.query(
    'INSERT INTO projects (name, color, created_by) VALUES ($1,$2,$3) RETURNING *',
    [name, color || '#2d5299', created_by || null]
  );
  res.json(result.rows[0]);
});

app.delete('/projects/:id', async (req, res) => {
  await client.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
  res.send('Silindi');
});

// ── TASKS ──

app.get('/tasks', async (req, res) => {
  const { project_id } = req.query;
  let result;

  if (project_id) {
    const id = parseInt(project_id);
    if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz project_id' });

    result = await client.query(
      'SELECT * FROM tasks WHERE project_id=$1 ORDER BY created_at',
      [id]
    );
  } else {
    result = await client.query('SELECT * FROM tasks ORDER BY created_at');
  }

  res.json(result.rows);
});

app.post('/tasks', async (req, res) => {
  const { title, description, col, tag, priority, assignee, project_id, created_by, deadline } = req.body;

  const result = await client.query(
    'INSERT INTO tasks (title, description, col, tag, priority, assignee, project_id, created_by, deadline) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [title, description || null, col || 'todo', tag || 'pill-blue', priority || 'pill-green', assignee || null, project_id || null, created_by || null, deadline || null]
  );

  res.json(result.rows[0]);
});

app.put('/tasks/:id', async (req, res) => {
  const { title, description, col, tag, priority, assignee, deadline } = req.body;

  const current = await client.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
  const t = current.rows[0];

  await client.query(
    'UPDATE tasks SET title=$1, description=$2, col=$3, tag=$4, priority=$5, assignee=$6, deadline=$7 WHERE id=$8',
    [
      title ?? t.title,
      description ?? t.description,
      col ?? t.col,
      tag ?? t.tag,
      priority ?? t.priority,
      assignee ?? t.assignee,
      deadline !== undefined ? deadline : t.deadline,
      req.params.id
    ]
  );

  res.send('Güncellendi');
});

app.put('/tasks/:id/col', async (req, res) => {
  const { col } = req.body;
  await client.query('UPDATE tasks SET col=$1 WHERE id=$2', [col, req.params.id]);
  res.send('Taşındı');
});

app.delete('/tasks/:id', async (req, res) => {
  await client.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
  res.send('Silindi');
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(3000, () => {
  console.log('Server 3000 portta başladı.');
});