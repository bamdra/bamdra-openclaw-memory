---
title: Usage
description: Learn how bamdra-openclaw-memory is used in real OpenClaw workflows, including implicit continuity and explicit tool control.
---

# Usage

## How the product is meant to be used

`bamdra-openclaw-memory` is designed to improve normal conversation first. In most sessions, the best experience is invisible continuity: the assistant quietly recovers the relevant branch, remembers durable facts, and avoids asking the user to repeat stable information.

## Two usage modes

### 1. Implicit continuity

This is the default experience. The user simply continues working in OpenClaw, while the memory layer:

- keeps earlier branches recoverable
- assembles compact context for the active thread
- reuses durable facts when they become relevant

### 2. Explicit operator control

When a workflow becomes more complex, operators can directly use memory tools:

- `memory_list_topics`
- `memory_switch_topic`
- `memory_save_fact`
- `memory_compact_topic`
- `memory_search`

## Typical usage flow

### During normal work

The user moves between planning, execution, and follow-up. The memory layer should preserve the important branch without turning the conversation into a visible debugging process.

### When a fact should be preserved

Use `memory_save_fact` for preferences, environment paths, project constraints, decisions, and other stable information that should remain useful later.

### When the team wants stronger control

Use `memory_list_topics` and `memory_switch_topic` when a specific branch should be resumed or isolated deliberately.

### When a branch grows long

Use `memory_compact_topic` to refresh summaries so later recovery remains accurate.

## Daily operator guidance

- let implicit recovery handle ordinary continuity
- save only durable, reusable facts
- search memory before asking the user to restate stable information
- keep memory behavior useful, not noisy
