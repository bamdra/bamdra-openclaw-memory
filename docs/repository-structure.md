# Repository Structure

## Principles

- Put implementation-specific code behind stable package boundaries.
- Keep OpenClaw-facing code thin.
- Keep design docs close to code, but separate from runtime assets.
- Default to local-first development and deployment.
- Avoid coupling one enhancement to another unless the dependency is explicit.

## Directory Layout

```text
openclaw-enhanced/
  bamdra-memory/
    docs/
      adr/
    plugins/
      bamdra-memory-context-engine/
      bamdra-memory-tools/
    skills/
      bamdra-memory-operator/
    packages/
      memory-core/
      memory-sqlite/
      memory-cache-memory/
      memory-cache-redis/
      topic-router/
      context-assembler/
    schemas/
    examples/
      configs/
    tests/
      fixtures/
  docs/
    repository-structure.md
  scripts/
```

## Responsibilities

### `bamdra-*`

Each enhancement owns its own:

- docs
- packages
- plugins
- tests
- schemas
- examples
- skills

This keeps one enhancement from leaking structure into another.

### `docs/`

Repository-level documents only.

### `bamdra-memory/plugins/bamdra-memory-context-engine/`

OpenClaw plugin responsible for:

- ingest hooks
- topic routing
- context assembly
- compaction policy
- session resume behavior

This plugin should stay thin and delegate most domain logic to packages under `bamdra-memory/packages/`.

### `bamdra-memory/plugins/bamdra-memory-tools/`

Optional plugin exposing memory tools such as:

- `memory_save_fact`
- `memory_search`
- `memory_list_topics`
- `memory_switch_topic`
- `memory_compact_topic`

### `bamdra-memory/skills/bamdra-memory-operator/`

Thin operational skill that teaches agents when to use memory tools.

This skill should not implement memory behavior in prompt text. It should only guide tool usage and policy-aware behavior.

### `bamdra-memory/packages/memory-core/`

Shared interfaces and domain models:

- topic
- fact
- snapshot
- memory store
- cache store

### `bamdra-memory/packages/memory-sqlite/`

Persistent store backed by SQLite.

### `bamdra-memory/packages/memory-cache-memory/`

Default local cache implementation using in-process memory.

### `bamdra-memory/packages/memory-cache-redis/`

Optional Redis cache implementation. This is not required for the default deployment path.

### `bamdra-memory/packages/topic-router/`

Topic detection and switching logic.

### `bamdra-memory/packages/context-assembler/`

Prompt assembly logic that selects:

- recent raw messages
- topic summaries
- pinned facts
- open loops

### `bamdra-memory/schemas/`

Schema definitions for configuration validation and examples.

### `bamdra-memory/examples/configs/`

Copy-paste examples for local-only and Redis-enabled deployments.

## Growth Rules

- New enhancements should start under a new `bamdra-*` bundle directory.
- Shared logic belongs in the component's `packages/`, not inside plugin entrypoints.
- If an enhancement introduces new config, add a schema and example.
- If a decision changes architecture or storage behavior, write an ADR.
