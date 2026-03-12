# Tools Memory V2

## Purpose

`bamdra-memory-tools` exposes explicit topic-control operations on top of the `bamdra-memory-context-engine` runtime.

It exists so agents can:

- inspect available topics in a session
- explicitly switch back to a previous branch
- pin critical facts so they are not lost in later turns
- force-refresh a topic summary when the branch state has changed
- search existing topics and pinned facts without replaying whole history

The tool layer should not reimplement routing or storage logic. It delegates to the context engine.

## Current Tools

### `memory_list_topics`

List known topics for a session.

Input:

```json
{
  "sessionId": "session-a"
}
```

Output:

```json
[
  {
    "id": "topic-123",
    "title": "OpenClaw memory sqlite architecture",
    "isActive": true
  }
]
```

Returned records currently include the full topic payload plus `isActive`.

### `memory_switch_topic`

Switch the active topic for a session.

Input:

```json
{
  "sessionId": "session-a",
  "topicId": "topic-123"
}
```

Output:

Returns the switched topic record.

### `memory_save_fact`

Persist a pinned fact for the active topic or a selected topic.

Input:

```json
{
  "sessionId": "session-a",
  "key": "workspace.default",
  "value": "~/.openclaw/workspaces/main",
  "category": "environment",
  "recallPolicy": "always",
  "tags": ["workspace", "openclaw"]
}
```

Output:

Returns the resolved `topicId` and the final tag list written with the fact.

### `memory_compact_topic`

Force-refresh the summary for the active topic or an explicitly selected topic.

Input:

```json
{
  "sessionId": "session-a"
}
```

Output:

Returns the refreshed topic record.

### `memory_search`

Search topics and durable facts for a session.

Input:

```json
{
  "sessionId": "session-a",
  "query": "sqlite"
}
```

Output:

Returns matching topics and facts, each with a lightweight `score` and `matchReasons`.

## Semantics

- `memory_list_topics` is read-only.
- `memory_switch_topic` updates:
  - in-memory cache
  - `session_state.active_topic_id`
  - topic `lastActiveAt`
- `memory_save_fact` writes a durable fact into SQLite and, when a topic is resolved, refreshes that topic summary.
- `memory_compact_topic` recalculates topic summaries and updates `session_state.last_compacted_at`.
- `memory_search` performs a lightweight SQLite-backed search across topic titles, summaries, labels, fact keys, fact values, and tags.

It does not create a new message by itself.

## Expected Agent Usage

Use `memory_list_topics` when:

- the user asks what branches exist
- the agent needs to show available prior discussion threads

Use `memory_switch_topic` when:

- the user says "go back to the earlier sqlite discussion"
- the agent wants to restore a prior branch before assembling context

Use `memory_save_fact` when:

- the user says "remember this"
- a background/environment/account constraint must survive topic drift
- the agent wants to pin a manually verified fact instead of waiting for extractor heuristics

Use `memory_compact_topic` when:

- the current branch summary feels stale
- several recent turns changed the branch direction
- the agent is about to hand off or export the branch state

Use `memory_search` when:

- the user asks whether a topic or fact already exists
- the agent needs to recover a fact without reloading the entire branch
- the branch exists but the exact topic id is unknown

## Non-Goals

- semantic search across all historical memory
- semantic search across all historical memory

Direct fact deletion and merge workflows still belong to later tool additions.
