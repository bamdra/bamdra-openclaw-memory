---
title: Architecture
description: Understand how bamdra-openclaw-memory, bamdra-user-bind, and bamdra-memory-vector work together as a continuity-first memory and knowledge system.
---

# Architecture

## One-command install

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

That one command now gives OpenClaw a complete memory stack:

- `bamdra-openclaw-memory` as the main runtime
- `bamdra-user-bind` as the identity and profile layer
- `bamdra-memory-vector` as the local knowledge and semantic recall layer

All three plugins can run independently, but together they complete the memory system.

## Technical architecture

<figure class="doc-figure">
  <img src="/images/architecture-technical-en.svg" alt="Bamdra technical architecture" />
  <figcaption>The three plugins can run independently, but together they form a clean identity, memory, and knowledge pipeline.</figcaption>
</figure>

## What each plugin contributes

### `bamdra-user-bind`

- turns unstable channel-facing sender IDs into a stable user boundary
- keeps profile data editable by humans but safe from agent-wide enumeration
- replaces most of what a per-user `USER.md` would normally try to do
- enables personalization that survives new sessions and restarts

### `bamdra-openclaw-memory`

- separates conversation branches into recoverable topics
- keeps context compact and relevant
- stores durable facts with scope and privacy boundaries
- recovers the right branch instead of replaying the entire conversation

### `bamdra-memory-vector`

- turns local Markdown into a real, maintainable knowledge base
- indexes `knowledge/`, `docs/`, `notes/`, and `ideas/`
- keeps private and shared knowledge separated
- improves fuzzy recall without requiring a heavy external vector database

## What users actually feel

<figure class="doc-figure">
  <img src="/images/architecture-user-en.svg" alt="How Bamdra feels to end users" />
  <figcaption>The user experience is simple: the assistant knows you, keeps continuity, and checks your local knowledge before going outward.</figcaption>
</figure>

## Why this is different from a prompt-only memory setup

- identity is explicit instead of inferred from raw sender IDs
- long-lived preferences do not need to live only in prompt text
- knowledge files can be edited like a normal document system
- the runtime can evolve with the user over time because profile, memory, and knowledge are all durable

## Best-practice knowledge layout

For most people, this layout is the easiest to maintain:

```text
private/
  knowledge/
    work/
    life/
    projects/
  docs/
    reference/
    manuals/
  notes/
    daily/
    meetings/
  ideas/
    product/
    personal/

shared/
  knowledge/
    team/
    products/
  docs/
    sop/
    changelog/
  notes/
    shared/
  ideas/
    backlog/
```

Guideline:

- `knowledge/` for stable reusable knowledge
- `docs/` for formal documentation and changelogs
- `notes/` for process-heavy or time-based records
- `ideas/` for unfinished but worth-searching thoughts
- `_runtime/` is system-managed and should not be your main editing area
