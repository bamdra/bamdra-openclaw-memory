---
title: bamdra-openclaw-memory
description: The main continuity-first memory runtime for OpenClaw.
---

# bamdra-openclaw-memory

## Install with one command

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

## What it is

`bamdra-openclaw-memory` is the main runtime in the suite.

It keeps OpenClaw coherent across long sessions, interruptions, branch switching, and restarts.

## Core value

Its job is not just to store memory.

Its job is to decide:

- what should stay active
- what should be recalled
- what should become a durable fact
- what should remain outside the prompt

That is what makes it a continuity-first runtime instead of a simple memory log.

## Main capabilities

- topic-aware branch handling
- durable fact storage with scope
- compact context assembly
- restart recovery
- operator-facing memory tools
- user-aware integration through `bamdra-user-bind`
- local knowledge recall through `bamdra-memory-vector`

## Why it matters

Without this layer:

- users repeat context
- interruptions break flow
- stable decisions disappear into chat history

With it:

- the right thread stays recoverable
- the prompt stays compact
- facts, preferences, and knowledge become reusable

## Best way to use it

- let it be the main memory and context-engine slot
- keep SQLite local
- let `bamdra-user-bind` own identity and personalization
- let `bamdra-memory-vector` own Markdown knowledge and semantic recall

## Architecture

- [Architecture](/guide/architecture)
