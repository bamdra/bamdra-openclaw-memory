PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  turn_id TEXT NOT NULL,
  parent_turn_id TEXT,
  role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  text TEXT NOT NULL,
  ts TEXT NOT NULL,
  raw_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session_ts
  ON messages (session_id, ts);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  parent_topic_id TEXT,
  summary_short TEXT NOT NULL DEFAULT '',
  summary_long TEXT NOT NULL DEFAULT '',
  open_loops_json TEXT NOT NULL DEFAULT '[]',
  labels_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_topics_session_last_active
  ON topics (session_id, last_active_at DESC);

CREATE TABLE IF NOT EXISTS topic_membership (
  message_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  score REAL NOT NULL,
  is_primary INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (message_id, topic_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_topic_membership_topic
  ON topic_membership (topic_id, created_at);

CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  sensitivity TEXT NOT NULL,
  recall_policy TEXT NOT NULL,
  confidence REAL NOT NULL,
  source_message_id TEXT,
  source_topic_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  FOREIGN KEY (source_topic_id) REFERENCES topics(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_facts_scope_key
  ON facts (scope, key);

CREATE TABLE IF NOT EXISTS fact_tags (
  fact_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (fact_id, tag),
  FOREIGN KEY (fact_id) REFERENCES facts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fact_tags_tag
  ON fact_tags (tag);

CREATE TABLE IF NOT EXISTS context_snapshots (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  topic_id TEXT,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_context_snapshots_session_kind
  ON context_snapshots (session_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS session_state (
  session_id TEXT PRIMARY KEY,
  active_topic_id TEXT,
  last_compacted_at TEXT,
  last_turn_id TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (active_topic_id) REFERENCES topics(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO schema_migrations (version, applied_at)
VALUES (1, CURRENT_TIMESTAMP);
