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
  price_at_purchase NUMERIC,        -- precio del fondo (en EUR) el día de esta aportación
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contributions ADD COLUMN IF NOT EXISTS price_at_purchase NUMERIC;

-- Histórico de precios de los fondos, compartido entre todos los usuarios
-- (todos siguen los mismos 5 fondos) — se indexa por ISIN, no por fund_id,
-- porque cada usuario tiene su propia copia de la fila "funds".
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  isin TEXT NOT NULL,
  date DATE NOT NULL,
  price_eur NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (isin, date)
);
CREATE INDEX IF NOT EXISTS idx_price_history_isin_date ON price_history(isin, date);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_funds_user ON funds(user_id);
CREATE INDEX IF NOT EXISTS idx_contrib_user ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contrib_round ON contributions(round_id);
