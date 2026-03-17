# bamdra-memory Overview

## What It Changes

`bamdra-memory` makes long OpenClaw conversations feel continuous again.

Without it, one session can quickly become messy:

- you plan a trip
- you get distracted by food ideas
- a work task interrupts the chat
- when you come back, the assistant has lost the earlier line cleanly

With `bamdra-memory`, the user experience is different:

- earlier threads can be recovered quietly
- durable facts can be saved once and reused later
- the active context stays short instead of replaying the whole chat
- restarts do not erase the useful parts of memory

## Example

Imagine this flow:

1. "Let's plan a short trip in China next month."
2. "If we go to Chengdu, what should we eat first?"
3. "I just got a work email. Help me reply politely."
4. "Back to the trip. If we only have one weekend, should we pick Chengdu or Hangzhou?"
5. "Please remember that I prefer hotels near a subway station."

Desired effect:

- the travel thread still feels intact after the email interruption
- the assistant answers in the right context without narrating internals
- the hotel preference becomes available later when the trip planning continues

## Who It Is For

- OpenClaw users running long sessions with frequent interruptions
- operators who want practical continuity instead of repeated restarts
- developers who want structured memory rather than prompt folklore
- local-first deployments that prefer SQLite by default

## Key Features

- `Rules plus natural-language guidance`
  Use explicit rules for boundaries and stable fact handling, while using natural-language understanding to keep recovery and switching smooth.

- `Topic-aware routing`
  Recover earlier conversation lines quietly when the user comes back to them.
- `Compact context assembly`
  Assemble prompt input from topic summary, open loops, recent messages, and pinned facts.
- `Durable fact model`
  Store facts with category, sensitivity, scope, confidence, and recall policy.
- `SQLite persistence`
  Use SQLite as the source of truth for messages, topics, facts, and session state.
- `Explicit memory tools`
  Give agents a direct way to inspect and control memory behavior.

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

## Main Components

- `memory-core`
  shared contracts and domain types
- `memory-sqlite`
  persistent SQLite store
- `memory-cache-memory`
  default in-process cache
- `topic-router`
  continuity routing logic
- `context-assembler`
  prompt context builder
- `fact-extractor`
  lightweight fact extraction heuristics
- `summary-refresher`
  summary refresh logic
- `bamdra-memory`
  unified runtime-facing plugin that owns the memory slot, hooks, and explicit tools

## Recommended Reading

- [Installation Guide](./installation.md)
- [Integration Guide](./integration.md)
- [Usage Guide](./usage.md)
- [Architecture Reference](../architecture.md)
