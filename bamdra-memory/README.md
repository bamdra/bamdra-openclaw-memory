# bamdra-memory

Topic-aware memory, context assembly, and durable fact recall for OpenClaw.

[中文文档](./README.zh-CN.md) | [English Docs](./docs/en/overview.md) | [中文文档目录](./docs/zh-CN/overview.md)

## What It Feels Like

Without `bamdra-memory`, a long OpenClaw session often feels like this:

- you switch from SQLite to Redis and the assistant starts mixing the two
- a path or account note mentioned 40 turns ago disappears
- "go back to the earlier branch" turns into a long replay of old chat

With `bamdra-memory`, it feels more like working with a notebook that has tabs:

- each thread becomes a topic
- important facts can be pinned instead of hoping the model remembers them
- switching back to earlier work restores the right branch instead of replaying everything
- the active context stays short and relevant

## A Simple Example

You talk to OpenClaw like this:

1. "Let's design the SQLite memory layout."
2. "Now switch to Redis as an optional cache."
3. "Remember that the main DB path is `/Users/mac/.openclaw/memory/main.sqlite`."
4. "Go back to the SQLite design."

Expected result:

- the SQLite and Redis discussions stay as separate branches
- the DB path remains recallable later
- "go back" returns to the SQLite branch quickly
- the prompt context contains the SQLite branch, not the Redis detour

## What It Is

`bamdra-memory` is an OpenClaw enhancement bundle that turns session memory into a practical runtime system instead of a prompt-only convention.

It gives OpenClaw:

- branch-aware conversation memory
- short, focused context for the current topic
- durable fact recall for paths, decisions, constraints, and references
- explicit memory tools when the agent needs manual control

## Why People Install It

People usually install `bamdra-memory` for one of these reasons:

- they run long sessions with many topic switches
- they want the assistant to remember stable facts without repeating them every hour
- they need "go back to the previous branch" to actually work
- they want memory to survive restarts

## Design Goals

- Keep prompt size bounded.
- Preserve important facts across topic drift.
- Support non-linear conversations inside one session.
- Default to lightweight local deployment.
- Keep Redis optional and cache-only.
- Keep OpenClaw-facing plugin code thin.

## Core Capabilities

- `Topic routing`
  Continue the current branch, switch to an earlier branch, or spawn a new one.
- `Context assembly`
  Build prompt context from recent topic turns, summaries, open loops, and pinned facts.
- `Durable fact recall`
  Store structured facts with category, sensitivity, scope, and recall policy.
- `Explicit operator tools`
  Use `memory_list_topics`, `memory_switch_topic`, `memory_save_fact`, `memory_compact_topic`, and `memory_search`.
- `Restart recovery`
  Reconstruct active state from SQLite after process restarts.
- `Optional Redis cache`
  Share hot session state across processes without changing the persistence model.

## Before / After

### Without It

- "We discussed this already" often means replaying chat history.
- Important facts fade unless repeated.
- Topic switches pollute the current prompt.

### With It

- Earlier branches stay recoverable.
- Stable facts can be pinned once and reused later.
- Current context is assembled around the active branch only.

## Repository Layout

- `docs/`
  Product docs, architecture notes, configuration, and runtime integration guides.
- `packages/`
  Shared domain packages such as storage, cache, routing, assembly, extraction, and summary refresh.
- `plugins/`
  OpenClaw-facing plugin adapters.
- `examples/`
  Mergeable configuration overlays.
- `schemas/`
  JSON schemas for config and tool contracts.
- `skills/`
  Operator-facing usage guidance.
- `tests/`
  Integration coverage for routing, tools, search, and context assembly.

## Installation

### Prerequisites

- Node.js 25.x or newer
- pnpm 10.x
- OpenClaw with local plugin loading enabled
- SQLite available through Node's built-in `node:sqlite`

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Verify

```bash
pnpm test
```

## Real Installation

If you want to use it in a local OpenClaw setup from this repo:

```bash
cd ~/workspace/openclaw-enhanced
pnpm install
pnpm build
mkdir -p ~/.openclaw/memory
```

Then edit `~/.openclaw/openclaw.json` and merge in the plugin settings shown in:

- [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

The plugin directories you point OpenClaw at are:

- `<repo-root>/bamdra-memory/plugins/bamdra-memory-context-engine`
- `<repo-root>/bamdra-memory/plugins/bamdra-memory-tools`

## Quick Start

1. Build the workspace.
2. Merge one of the example configs into your OpenClaw config.
3. Load the plugin directories under `plugins.load.paths`.
4. Set `plugins.slots.contextEngine = "bamdra-memory-context-engine"`.
5. Restart OpenClaw.

Example overlays:

- Local SQLite + in-memory cache:
  [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- SQLite + Redis cache:
  [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
- Tools-only overlay:
  [openclaw.plugins.bamdra-memory-tools.json](./examples/configs/openclaw.plugins.bamdra-memory-tools.json)

## Documentation

### English Docs

- [Product Overview](./docs/en/overview.md)
- [Installation Guide](./docs/en/installation.md)
- [Integration Guide](./docs/en/integration.md)
- [Usage Guide](./docs/en/usage.md)
- [Prompting Guide](./docs/en/prompting.md)

### 中文文档

- [产品概览](./docs/zh-CN/overview.md)
- [安装指南](./docs/zh-CN/installation.md)
- [接入指南](./docs/zh-CN/integration.md)
- [使用指南](./docs/zh-CN/usage.md)
- [提示词与文件写法](./docs/zh-CN/prompting.md)

### Technical Reference

- [Architecture](./docs/architecture.md)
- [Data Model](./docs/data-model.md)
- [Configuration](./docs/configuration.md)
- [Runtime Integration Notes](./docs/openclaw-runtime-integration.md)
- [Memory Tools](./docs/bamdra-memory-tools.md)

## Current Status

The bundle is functionally usable in local OpenClaw deployments and is covered by workspace build and integration tests.

The remaining long-term integration task is to align the runtime plugin adapters with the final upstream OpenClaw plugin SDK surface once that context-engine API is stabilized.
