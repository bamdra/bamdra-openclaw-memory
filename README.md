# openclaw-topic-memory

Topic-aware memory for OpenClaw with durable recall. 为 OpenClaw 提供话题感知记忆与持久召回。

This repository publishes the current `bamdra-memory` implementation as a standalone OpenClaw memory project.

## What This Repo Gives You

- topic-aware conversation branches
- durable fact recall for paths, constraints, preferences, and references
- compact active-context assembly
- SQLite persistence by default
- optional Redis cache for hot state
- explicit memory tools for switching, saving, compacting, and searching memory

## Start Here

- English:
  [bamdra-memory README](./bamdra-memory/README.md)
- 中文：
  [bamdra-memory README.zh-CN](./bamdra-memory/README.zh-CN.md)

## Repository Layout

- `bamdra-memory/`
  The actual implementation bundle, including docs, packages, plugins, examples, schemas, skills, and tests.
- `docs/`
  Repository-level notes.

## Quick Commands

```bash
pnpm install
pnpm build
pnpm test
```

## Current Position

The project is ready for local OpenClaw usage and evaluation. The main long-term follow-up is aligning the runtime adapter with the final upstream OpenClaw context-engine SDK surface when that API stabilizes.
