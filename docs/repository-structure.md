# Repository Structure

## Principles

- keep public repository boundaries aligned with public plugin boundaries
- keep OpenClaw-facing runtime code thin
- keep shared implementation logic behind internal packages
- keep private user data handling isolated and explicit
- default to local-first deployment and low operational overhead

## Workspace Layout

```text
openclaw-enhanced/
  bamdra-openclaw-memory/
    docs/
    examples/
    packages/
      bamdra-memory-context-engine/
      bamdra-memory-tools/
      context-assembler/
      memory-cache-memory/
      memory-core/
      memory-sqlite/
      topic-router/
    plugins/
      bamdra-memory/
    schemas/
    skills/
      bamdra-memory-operator/
    tests/
  bamdra-user-bind/
    src/
    dist/
    package.json
    openclaw.plugin.json
  bamdra-memory-vector/
    src/
    dist/
    package.json
    openclaw.plugin.json
  bamdra-site/
    .vitepress/
    guide/
    zh/
    public/
  docs/
    repository-structure.md
```

## Public Release Boundaries

The public open-source suite is organized around three repositories:

- `bamdra-openclaw-memory`
- `bamdra-user-bind`
- `bamdra-memory-vector`

`bamdra-memory-context-engine` and `bamdra-memory-tools` are no longer public standalone plugins. They now exist as internal packages under `bamdra-openclaw-memory/packages/`.

## Responsibilities

### `bamdra-openclaw-memory/`

Owns the main continuity-first memory runtime:

- topic-aware memory behavior
- context assembly
- durable facts
- SQLite persistence
- plugin entrypoint for OpenClaw
- integration tests and examples

### `bamdra-user-bind/`

Owns identity and user-profile infrastructure:

- channel identity resolution
- user binding storage
- profile injection
- admin-safe profile tools
- audit and isolation controls

### `bamdra-memory-vector/`

Owns optional semantic retrieval enhancement:

- Markdown memory artifacts
- local vector-style index
- scoped retrieval for current user memory
- hybrid retrieval integration surface

### `bamdra-site/`

Owns public-facing website content:

- product narrative
- installation guides
- download center
- bilingual marketing and docs pages

## Internal Package Rules

- shared logic belongs in `packages/`, not inside plugin entrypoints
- public plugins should expose stable entrypoints and minimal runtime wiring
- if a feature changes storage or public behavior, document it in the owning repo
- if a plugin is not meant to be released independently, it should not live as a public plugin folder
