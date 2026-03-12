# bamdra-memory Overview

## Summary

`bamdra-memory` is a topic-aware memory system for OpenClaw. It helps agents keep track of multiple branches within one session, recall durable facts without replaying long histories, and assemble compact prompt context for the active branch.

## Who It Is For

- OpenClaw users running long-lived personal or operator sessions
- builders who need structured memory instead of ad hoc prompt notes
- local-first deployments that want SQLite persistence by default
- multi-process deployments that may need Redis as a cache layer

## The Problem

In long sessions, one chat often contains several interleaved threads:

- architecture discussion
- implementation details
- operational notes
- environment constraints
- sensitive account reminders

If all memory is stored only in recent turns or free-form summaries, agents forget important details, mix branches together, and spend tokens reloading old context.

## What bamdra-memory Changes

`bamdra-memory` treats memory as a structured system:

- each session can contain multiple topics
- one topic is marked active
- facts are stored as durable records instead of hidden inside summaries
- the prompt builder pulls only the active topic's context
- session state survives process restarts

## Key Features

- `Topic-aware routing`
  Detect whether a new message belongs to the current topic, a previous topic, or a new topic.
- `Compact context assembly`
  Assemble prompt input from topic summary, open loops, recent messages, and pinned facts.
- `Durable fact model`
  Store facts with category, sensitivity, scope, confidence, and recall policy.
- `SQLite persistence`
  Use SQLite as the source of truth for messages, topics, facts, and session state.
- `Optional Redis cache`
  Use Redis only for hot state when you need multi-process sharing.
- `Explicit memory tools`
  Give agents a direct way to inspect and control memory behavior.

## Capability Map

### Conversation Branching

- keep unrelated work in separate topics
- switch back to prior work without replaying the entire session
- preserve active topic identity across turns

### Memory Recall

- store always-on facts
- store topic-bound facts
- keep secret references without injecting secret values

### Prompt Efficiency

- avoid injecting full session history
- focus on the active topic only
- bound prompt size through configurable limits

### Operational Simplicity

- local-first setup
- no Redis requirement for single-node use
- deterministic storage model

## Design Goals

- bounded prompt size
- branch-safe memory recall
- restart recovery
- local-first deployment
- thin plugin adapters
- explicit tool-driven control when needed

## Non-Goals

- full distributed memory infrastructure in v1
- semantic search over all history
- replacing every OpenClaw memory feature
- using Redis as the system of record

## Main Components

- `memory-core`
  shared contracts and domain types
- `memory-sqlite`
  persistent SQLite store
- `memory-cache-memory`
  default in-process cache
- `memory-cache-redis`
  optional Redis cache
- `topic-router`
  topic selection logic
- `context-assembler`
  prompt context builder
- `fact-extractor`
  lightweight fact extraction heuristics
- `summary-refresher`
  topic summary refresh logic
- `bamdra-memory-context-engine`
  runtime-facing context engine adapter
- `bamdra-memory-tools`
  explicit tool surface

## Recommended Reading

- [Installation Guide](./installation.md)
- [Integration Guide](./integration.md)
- [Usage Guide](./usage.md)
- [Architecture Reference](../architecture.md)
