-- Esquema de la base de datos de la Cartera de Inversión.
-- Se ejecuta una vez con scripts/setup-db.mjs (ver README).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funds (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  isin TEXT,
  target_weight NUMERIC NOT NULL,   -- 0.45 = 45%
  ter NUMERIC,                      -- 0.0006 = 0,06%
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fund_id INTEGER NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  round_id TEXT NOT NULL,           -- agrupa las líneas de una misma aportación mensual
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funds_user ON funds(user_id);
CREATE INDEX IF NOT EXISTS idx_contrib_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contrib_round ON contributions(round_id);
