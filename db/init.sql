DROP TABLE IF EXISTS dungeons;

CREATE TABLE dungeons (
  id SERIAL PRIMARY KEY,
  seed VARCHAR(255) NOT NULL,
  size INTEGER NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  enemies JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '{}',
  paths JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dungeons_created_at ON dungeons(created_at DESC);
