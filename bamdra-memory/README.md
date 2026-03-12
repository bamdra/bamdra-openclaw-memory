# bamdra-memory

Topic-aware memory, context assembly, and durable fact recall for OpenClaw.

[中文文档](./README.zh-CN.md) | [English Docs](./docs/en/overview.md) | [中文文档目录](./docs/zh-CN/overview.md)

## What It Feels Like

Without `bamdra-memory`, a long OpenClaw session often feels like this:

- you start planning a trip, drift into food ideas, then get interrupted by work
- after helping with the interruption, the assistant no longer holds the earlier context cleanly
- details that should have stayed obvious now need to be repeated

With `bamdra-memory`, it feels more like working with a notebook that has tabs:

- different threads stay separated in the background
- important facts can be pinned instead of hoping the model remembers them
- returning to an earlier subject feels natural instead of requiring a replay
- the active context stays short and relevant

## A Simple Example

You talk to OpenClaw like this:

1. "Let's figure out where to travel next month."
2. "If we go to Osaka, what food should we prioritize?"
3. "I just got a work email. Help me draft a polite reply saying I can deliver the file tomorrow morning."
4. "Back to the trip. Between Osaka and Kyoto, which is better for a short food-focused weekend?"

Expected result:

- the travel conversation remains coherent even after the email interruption
- the food thread still feels connected to the travel plan
- the work-email detour does not pollute the later travel answer
- the assistant feels continuous without needing to explain what it did internally

## What It Is

`bamdra-memory` is an OpenClaw enhancement bundle that turns session memory into a practical runtime system instead of a prompt-only convention.

It gives OpenClaw:

- topic-aware conversation memory
- short, focused context for the current topic
- durable fact recall for paths, decisions, constraints, and references
- explicit memory tools when the agent needs manual control

## Why People Install It

People usually install `bamdra-memory` for one of these reasons:

- they run long sessions with many interruptions and topic changes
- they want the assistant to remember stable facts without repeating them every hour
- they want the assistant to naturally return to earlier conversation threads
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
  Keep unrelated conversations separated and recover earlier threads naturally.
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

- Node.js 22.x or newer
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

## Recommended Installation

For normal users, the recommended path is:

1. download a compiled release package
2. place the plugin folders under `~/.openclaw/extensions/`
3. enable them in `~/.openclaw/openclaw.json`

Local building from source is mainly for developers.

## Developer Build From Source

If you want to build from source:

```bash
git clone <your-fork-or-release-source>
cd openclaw-topic-memory
pnpm install
pnpm build
mkdir -p ~/.openclaw/memory
```

Then edit `~/.openclaw/openclaw.json` and merge in the plugin settings shown in:

- [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

The plugin directories OpenClaw should load are:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

## Quick Start

1. Download the compiled release or build from source.
2. Put the plugin folders under `~/.openclaw/extensions/`.
3. Merge one of the example configs into your OpenClaw config.
4. Load those directories under `plugins.load.paths`.
5. Set `plugins.slots.contextEngine = "bamdra-memory-context-engine"`.
6. Restart OpenClaw.

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
