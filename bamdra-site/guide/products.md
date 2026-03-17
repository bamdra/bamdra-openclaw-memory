---
title: Product Suite
description: Understand the three public Bamdra plugins, what each one does, and why they are strongest when used together.
---

# Product Suite

## Install the suite with one command

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

That single install is the fastest way to get the full stack into OpenClaw.

## The three public plugins

All three plugins can run independently. Together they form a complete memory and knowledge system.

### `bamdra-openclaw-memory`

The continuity-first runtime.

It is responsible for:

- topic routing
- long-session continuity
- durable fact storage
- compact context assembly
- recovery after interruptions and restarts

Its job is to keep the conversation on the right branch without making the prompt grow out of control.

### `bamdra-user-bind`

The identity and profile layer.

It is responsible for:

- turning raw channel sender IDs into stable user boundaries
- storing profile data safely
- mirroring profiles into editable Markdown
- separating ordinary user access from admin operations
- feeding personalization into the memory system

This is what makes the assistant feel like it knows the user instead of merely remembering a session.

### `bamdra-memory-vector`

The local knowledge and semantic retrieval layer.

It is responsible for:

- indexing local Markdown knowledge
- separating private and shared knowledge roots
- semantic recall for fuzzy questions
- keeping knowledge human-readable and editable

This closes the last major gap in a continuity-first memory system: a real, maintainable knowledge base.

## Why the split matters

Keeping the suite split into three plugins is deliberate.

- different teams can adopt only the layer they need
- the identity layer stays reusable outside the main memory plugin
- the knowledge layer stays reusable as a standalone local retrieval helper
- security boundaries are clearer
- release and versioning are easier to reason about

## Why they are strongest together

The real product value appears when all three are present:

- `bamdra-user-bind` knows who the user is
- `bamdra-openclaw-memory` knows what thread the work is in
- `bamdra-memory-vector` knows which local document or note likely matters

That means the assistant can:

- greet the user in the right style
- continue the right branch
- recall stable decisions and preferences
- search the local knowledge base before going to the web
- improve over time as profile data, memory, and knowledge all accumulate

## Architecture

See the full diagrams here:

- [Architecture](/guide/architecture)

## Which one should you install first

Start with `bamdra-openclaw-memory`.

Why:

- it is the main runtime entry point
- it gives the clearest immediate improvement in continuity
- it auto-provisions the identity layer
- it stages the vector layer so the knowledge system is ready immediately

## Ideal adoption path

### Stage 1: continuity

Install `bamdra-openclaw-memory` so interruptions and topic drift stop breaking long sessions.

### Stage 2: personalization

Let `bamdra-user-bind` build stable user profiles and editable Markdown mirrors.

### Stage 3: knowledge

Point `bamdra-memory-vector` at private and shared Markdown roots so local docs, notes, SOPs, changelogs, and ideas become searchable.

## Repositories

- [GitHub home](https://github.com/bamdra)
- [bamdra-openclaw-memory](https://github.com/bamdra/bamdra-openclaw-memory)
- [bamdra-user-bind](https://github.com/bamdra/bamdra-user-bind)
- [bamdra-memory-vector](https://github.com/bamdra/bamdra-memory-vector)
