# Memory V2 Architecture

## Goals

- Keep prompt size bounded.
- Avoid losing critical context when the conversation is interrupted and later resumed.
- Support non-linear conversations inside a single session.
- Support both implicit topic recovery and explicit topic switching inside a single session.
- Persist state across restarts.
- Stay lightweight in single-node deployments.
- Preserve agent and user isolation boundaries.

## Non-Goals

- full distributed system design in v1
- replacing every existing OpenClaw memory feature
- storing all memory only in Markdown files
- cross-user or cross-agent private memory recall

## High-Level Layers

### 1. Persistent Store

Default: SQLite

Responsibilities:

- source of truth
- transactional writes
- restart recovery
- structured queries
- preserve data for the owning agent/session boundary

### 2. Cache Store

Default: in-process memory

Responsibilities:

- hot topic state
- recent summaries
- active session routing state
- frequently used pinned facts

### 3. Context Engine Plugin

Responsibilities:

- receive message and tool events
- route messages into conversation tracks
- maintain the current working context per session
- assemble prompt context before model execution
- trigger summary refresh and compaction
- respect runtime isolation boundaries instead of widening them

### 4. Tool Layer

Responsibilities:

- explicit memory write
- explicit search
- topic inspection and manual control
- forced compaction

## Core Runtime Flow

### Ingest

1. Receive message or tool event.
2. Write raw event to persistent store.
3. Update cache for the active session.
4. Extract lightweight message features.

### Conversation Routing

For each new user turn:

1. Compare against current active topic.
2. Compare against recent active topics in the same session.
3. Continue current topic, recover an existing topic, or create a new topic.
4. Store topic membership with confidence and routing reason.

### Context Assembly

Before prompt build:

1. Load current active topic.
2. Pull recent raw turns for the topic.
3. Pull topic short summary.
4. Pull open loops.
5. Pull pinned facts using tags and recall policy.
6. Assemble compact prompt context.

### Async Maintenance

After assistant response:

- refresh topic summaries
- update open loops
- extract long-lived facts
- refresh cache entries

## Fact Model

Facts should not be buried only inside summaries.

Each fact is a structured record with:

- category
- tags
- scope
- sensitivity
- recall policy
- confidence

This supports reliable recall of:

- environment details
- account information
- background assumptions
- security constraints
- stable preferences

Facts are still scoped inside runtime boundaries. Durable storage should improve continuity for the same conversation owner, not create a cross-user memory leak.

## Default Context Recipe

For a normal turn, inject:

- recent raw turns for the active topic
- active topic short summary
- active topic open loops
- always-on pinned facts
- topic-matched pinned facts

Do not inject full session history by default.
Do not treat another agent's session or another user's conversation as part of the same recall scope.

## Cache Backends

### Local Memory Cache

Default backend.

Use for:

- single process deployments
- low operational overhead
- minimal latency

## Failure Model

If cache is lost:

- recover from SQLite
- rebuild hot topic state lazily

If the process restarts:

- persistent data remains in SQLite
- active topic can be reconstructed from the latest session state and topic activity

## Runtime Validation Notes

The current implementation has been hardened for OpenClaw runtime behavior observed in real deployments:

- the `memory` slot must be occupied by `bamdra-openclaw-memory`
- built-in `memory-core` should be denied to avoid slot conflicts
- the compatibility `contextEngine` slot should also point to `bamdra-openclaw-memory` on current OpenClaw builds
- explicit tool registration is required to avoid shadowing by built-in tools
