-- Migration 003: CHECK constraints ve index'ler
-- Çalıştır: psql -U postgres -d taskapp -f migrations/003_constraints_indexes.sql

BEGIN;

-- ── CHECK Constraints ──

ALTER TABLE tasks
  ADD CONSTRAINT tasks_col_check
    CHECK (col IN ('todo', 'doing', 'done')),
  ADD CONSTRAINT tasks_tag_check
    CHECK (tag IN ('pill-blue','pill-violet','pill-green','pill-amber','pill-red','pill-cyan')),
  ADD CONSTRAINT tasks_priority_check
    CHECK (priority IN ('pill-green','pill-amber','pill-red'));

ALTER TABLE users
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin','user','frontend','backend','design','devops','test_expert','scrum_master'));

-- ── Index'ler ──

-- Görevler sık sık project_id ve assignee'ye göre filtreleniyor
CREATE INDEX IF NOT EXISTS idx_tasks_project_id  ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee     ON tasks (assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_col          ON tasks (col);

-- Deadline'lar rol'e göre filtreleniyor
CREATE INDEX IF NOT EXISTS idx_deadlines_assigned_role ON deadlines (assigned_role);

-- user_projects zaten composite PK (user_id, project_id) var — project_id tarafı index'lenir
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects (project_id);

COMMIT;
