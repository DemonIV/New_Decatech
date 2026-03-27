const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'taskapp',
  password: '165516',
  port: 5432,
});

client.connect()
  .then(() => console.log('DB bağlı'))
  .catch(err => console.error(err));

app.post('/users', async (req, res) => {
  const { username, password, role } = req.body;

  await client.query(
    'INSERT INTO users (username, password, role) VALUES ($1,$2,$3)',
    [username, password, role || 'user']
  );

  res.send('Kullanıcı eklendi');
});

// LOGIN
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const result = await client.query(
    'SELECT * FROM users WHERE username=$1 AND password=$2',
    [username, password]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Hatalı giriş' });
  }

  res.json(result.rows[0]);
});

// ── USERS ──

// Tüm kullanıcıları listele
app.get('/users', async (req, res) => {
  const result = await client.query('SELECT id, username, role FROM users ORDER BY id');
  res.json(result.rows);
});

// Kullanıcı sil
app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  await client.query('DELETE FROM users WHERE id=$1', [id]);
  res.send('Silindi');
});

// Rol güncelle
app.put('/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  await client.query('UPDATE users SET role=$1 WHERE id=$2', [role, id]);
  res.send('Rol güncellendi');
});

// ── DEADLINES ──

// Deadline tablosu yoksa önce şunu çalıştır:
// CREATE TABLE deadlines (
//   id SERIAL PRIMARY KEY,
//   title VARCHAR(100) NOT NULL,
//   description TEXT,
//   due_date DATE NOT NULL,
//   assigned_role VARCHAR(20) NOT NULL,
//   created_by INT REFERENCES users(id),
//   created_at TIMESTAMP DEFAULT NOW()
// );

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
    // Admin hepsini görür
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

// Şifre güncelle
app.put('/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Şifre boş olamaz' });
  await client.query('UPDATE users SET password=$1 WHERE id=$2', [password, id]);
  res.send('Şifre güncellendi');
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
    const id = parseInt(project_id); // parseInt ekle
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
      title      ?? t.title,
      description ?? t.description,
      col        ?? t.col,
      tag        ?? t.tag,
      priority   ?? t.priority,
      assignee   ?? t.assignee,
      deadline   !== undefined ? deadline : t.deadline,
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

// Kullanıcının projelerini getir
app.get('/users/:id/projects', async (req, res) => {
  const result = await client.query(
    'SELECT p.* FROM projects p JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = $1',
    [req.params.id]
  );
  res.json(result.rows);
});

// Kullanıcıya proje ekle
app.post('/users/:id/projects', async (req, res) => {
  const { project_id } = req.body;
  await client.query(
    'INSERT INTO user_projects (user_id, project_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.params.id, project_id]
  );
  res.send('Eklendi');
});

// Kullanıcıdan proje çıkar
app.delete('/users/:id/projects/:pid', async (req, res) => {
  await client.query(
    'DELETE FROM user_projects WHERE user_id=$1 AND project_id=$2',
    [req.params.id, req.params.pid]
  );
  res.send('Çıkarıldı');
});

app.put('/deadlines/:id', async (req, res) => {
  const { due_date } = req.body;
  await client.query('UPDATE deadlines SET due_date=$1 WHERE id=$2', [due_date, req.params.id]);
  res.send('Güncellendi');
});

app.get('/roles', async (req, res) => {
  const result = await client.query('SELECT DISTINCT role FROM users ORDER BY role');
  res.json(result.rows.map(r => r.role));
});

app.listen(3000, () => {
  console.log('Server 3000 portta');
});