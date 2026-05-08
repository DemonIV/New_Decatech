-- Migration 001: tasks.assignee VARCHAR(10) → INTEGER FK
-- Çalıştır: psql -U postgres -d taskapp -f migrations/001_assignee_fk.sql

BEGIN;

ALTER TABLE tasks DROP COLUMN assignee;
ALTER TABLE tasks ADD COLUMN assignee INTEGER REFERENCES users(id) ON DELETE SET NULL;

COMMIT;
