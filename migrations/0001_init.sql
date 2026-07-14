CREATE TABLE IF NOT EXISTS schedules (
  id            TEXT PRIMARY KEY,
  start_time    TEXT,
  end_time      TEXT,
  mode          TEXT NOT NULL,
  rule          TEXT NOT NULL,
  boss_id       INTEGER,
  stage_id      INTEGER NOT NULL,
  rare_weapons  TEXT NOT NULL,
  weapon_list   TEXT NOT NULL,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON schedules(start_time DESC);
