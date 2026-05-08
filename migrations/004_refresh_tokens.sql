-- Migration 004: refresh_tokens tablosu
-- Çalıştır: psql -U postgres -d taskapp -f migrations/004_refresh_tokens.sql

BEGIN;

CREATE TABLE public.refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token   ON public.refresh_tokens (token);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens (user_id);

COMMIT;
