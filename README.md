# openclaw-topic-memory

Topic-aware memory for OpenClaw with durable recall. 为 OpenClaw 提供话题感知记忆与持久召回。

This repository publishes the current `bamdra-memory` implementation as a standalone OpenClaw memory project.

## Why It Is Useful

- long OpenClaw sessions stay coherent across interruptions
- stable preferences, paths, and constraints can be reused later
- the active context stays compact instead of replaying whole chat histories
- SQLite persistence is built in, with Redis kept optional

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

## Recommended Public Description

`Topic-aware memory for OpenClaw with durable recall. 为 OpenClaw 提供话题感知记忆与持久召回。`

## Current Position

The project is ready for local OpenClaw usage and evaluation. The main long-term follow-up is aligning the runtime adapter with the final upstream OpenClaw context-engine SDK surface when that API stabilizes.
