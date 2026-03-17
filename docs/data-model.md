# Memory V2 Data Model

## Storage Strategy

- SQLite is the source of truth.
- Cache stores only derived or hot state.
- JSONL logs remain useful for audit trails, but are not the primary query model.

This model exists to support a user-facing effect: after an interruption, the assistant can return to the earlier line of work without replaying the whole chat.

## Core Tables

### `messages`

Stores raw conversational and tool events.

Suggested fields:

- `id`
- `session_id`
- `turn_id`
- `parent_turn_id`
- `role`
- `event_type`
- `text`
- `ts`
- `raw_json`

### `topics`

Stores logical conversation threads within a session.

Suggested fields:

- `id`
- `session_id`
- `title`
- `status`
- `parent_topic_id`
- `summary_short`
- `summary_long`
- `open_loops_json`
- `labels_json`
- `created_at`
- `last_active_at`

### `topic_membership`

Maps messages to one or more conversation threads.

Suggested fields:

- `message_id`
- `topic_id`
- `score`
- `is_primary`
- `reason`
- `created_at`

### `facts`

Stores stable, recallable knowledge that should survive conversation drift.

Suggested fields:

- `id`
- `scope`
- `category`
- `key`
- `value`
- `sensitivity`
- `recall_policy`
- `confidence`
- `source_message_id`
- `source_topic_id`
- `updated_at`

### `fact_tags`

Normalizes labels for fact recall.

Suggested fields:

- `fact_id`
- `tag`

### `context_snapshots`

Stores reusable prompt-ready snapshots.

Suggested fields:

- `id`
- `session_id`
- `topic_id`
- `kind`
- `content`
- `created_at`

### `session_state`

Stores current session routing state.

Suggested fields:

- `session_id`
- `active_topic_id`
- `last_compacted_at`
- `last_turn_id`
- `updated_at`

## Fact Taxonomy

### Categories

- `background`
- `environment`
- `account`
- `security`
- `preference`
- `project`
- `decision`
- `constraint`

### Sensitivity

- `normal`
- `sensitive`
- `secret_ref`

`secret_ref` means the memory can mention where the secret lives, but should not inline the secret value into prompt context.

### Recall Policy

- `always`
- `topic_bound`
- `on_demand`

## Topic Labels

Topic summaries are not enough on their own.

Topics should also have labels such as:

- `openclaw`
- `memory-v2`
- `feishu`
- `infra`
- `account`
- `security`

Labels are used to:

- improve routing
- pull relevant pinned facts
- recover older branches accurately

## Recovery Behavior

On process start:

1. Load active sessions from persistent metadata.
2. Restore `active_topic_id` from `session_state`.
3. Warm the local cache lazily on first access.

## Initial Schema Status

The first implementation pass includes a concrete SQLite schema at:

- `bamdra-openclaw-memory/packages/memory-sqlite/src/schema.sql`

This schema covers:

- `messages`
- `topics`
- `topic_membership`
- `facts`
- `fact_tags`
- `context_snapshots`
- `session_state`
- `schema_migrations`

The schema is intentionally minimal and does not yet include:

- embeddings
- classifier feature tables
- topic edge graphs beyond `parent_topic_id`
