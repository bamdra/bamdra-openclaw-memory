# bamdra-memory

Give one OpenClaw session effectively unlimited continuity: no easy amnesia, no topic-switch chaos, and no runaway prompt growth.

Topic-aware memory, bounded context assembly, and durable fact recall for OpenClaw.

`bamdra-memory` helps a single session stay coherent across interruptions, branch naturally across multiple topics, and keep token usage under control by assembling context around the active thread instead of replaying everything.

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

1. "Let's plan a short trip in China for next month."
2. "If we go to Chengdu, what should we eat first?"
3. "I just got a work email. Help me draft a polite reply saying I can send the proposal tomorrow morning."
4. "Back to the trip. If we only have one weekend, should we pick Chengdu or Hangzhou?"
5. "Please remember that I prefer hotels near a subway station."

Expected result:

- the travel conversation remains coherent even after the email interruption
- the food thread still feels connected to the travel plan
- the work-email detour does not pollute the later travel answer
- the assistant feels continuous without needing to explain what it did internally
- the hotel preference can be reused later without asking again

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
- they want the same agent and session to survive restarts cleanly

## Design Goals

- Keep prompt size bounded.
- Preserve important facts across topic drift.
- Support non-linear conversations inside one session.
- Support both implicit topic recovery and explicit topic control inside one session.
- Preserve agent and user isolation boundaries.
- Default to lightweight local deployment.
- Keep Redis optional and cache-only.
- Keep OpenClaw-facing plugin code thin.

## Isolation Boundaries

`bamdra-memory` is not designed as a global shared memory pool.

- memory is isolated across agents by default
- memory is isolated across users and sessions by default
- topic switching happens inside one conversation boundary
- durable facts still need to respect the runtime's agent and session isolation rules

For open source users, the right mental model is "continuity within the right boundary", not "cross-user recall".

## Core Capabilities

- `Implicit continuity`
  Keep unrelated conversations separated in the background and recover earlier threads naturally.
- `Context assembly`
  Build prompt context from recent topic turns, summaries, open loops, and pinned facts.
- `Durable fact recall`
  Store structured facts with category, sensitivity, scope, and recall policy.
- `Explicit operator tools`
  Use `memory_list_topics`, `memory_switch_topic`, `memory_save_fact`, `memory_compact_topic`, and `memory_search`.
- `Restart recovery`
  Reconstruct active state from SQLite for the same agent and session after process restarts.
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
  Operator-facing usage guidance and optional behavior-layer skills.
- `tests/`
  Integration coverage for routing, tools, search, and context assembly.

## Installation

### Prerequisites

- OpenClaw
- Node.js 22.x or newer
- a writable `~/.openclaw/` directory

## Quick Start For Most Users

Most users should use the prebuilt release package instead of building from source.

1. Download the latest release archive from GitHub Releases.
2. Unzip it.
3. Copy these folders into `~/.openclaw/extensions/`:
   - `bamdra-memory-context-engine`
   - `bamdra-memory-tools`
4. Create the SQLite directory:

```bash
mkdir -p ~/.openclaw/extensions ~/.openclaw/memory
```

5. Merge the config from one of these examples into `~/.openclaw/openclaw.json`:
   - [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
   - [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
6. Restart OpenClaw.

The plugin directories OpenClaw should load are:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

For a step-by-step release install flow, read:

- [Installation Guide](./docs/en/installation.md)
- [Prompting And Best Practices](./docs/en/prompting.md)

## Developer Build From Source

If you want to build from source:

```bash
git clone git@github.com:bamdra/openclaw-topic-memory.git
cd openclaw-topic-memory
pnpm install
pnpm build
pnpm test
mkdir -p ~/.openclaw/memory
```

Then copy the built plugin folders from:

- `./bamdra-memory/plugins/bamdra-memory-context-engine`
- `./bamdra-memory/plugins/bamdra-memory-tools`

into:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

## Quick Demo

If installation is working, a conversation like this should feel natural:

1. "Let's plan a weekend trip in China."
2. "If we go to Chengdu, what food should we prioritize?"
3. "I just got a work email. Help me write a polite reply."
4. "Back to the trip. If we only have one weekend, should we pick Chengdu or Hangzhou?"
5. "Please remember that I prefer hotels near a subway station."
6. "For that trip, which area is easier if I care about subway access?"

What you should notice:

- the travel conversation still feels coherent after the work interruption
- the assistant does not narrate internal memory operations
- the saved hotel preference becomes usable later

## Why Not Just Summaries?

- summaries alone are easy to overwrite when the conversation drifts
- stable facts should not depend on whether they survive in a paragraph
- long sessions work better when continuity and recall are separate responsibilities

## FAQ

### Do I need Redis?

No. SQLite plus the in-process cache is the default and recommended setup for most users.

### Do I need to manually switch topics?

Usually no. Most recovery should happen quietly in the background. Explicit tools are there for operators and special cases.

### Does it survive restarts?

Yes, for the same agent and session boundary. It is not meant to bypass user or agent isolation.

## Validate The Workspace

If you are working from source, validate with:

```bash
pnpm test
```

## Pre-release Validation

The current release candidate has been verified against these runtime issues:

- `memory` slot binding to `bamdra-memory-context-engine`
- explicit denial of built-in `memory-core`
- tool-side fallback bootstrap when the runtime engine is not shared across processes
- explicit registration for both `memory_*` and `bamdra_*` tool names
- SQLite write path and restart recovery

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
