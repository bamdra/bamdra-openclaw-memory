# OpenClaw Feasibility

## Summary

`memory-v2` is feasible in OpenClaw, but the implementation should be centered on a custom `contextEngine` plugin instead of prompt-only instructions.

## Why

The required behavior is not limited to memory lookup. It includes:

- continuous message ingest
- topic branch detection
- session-level context orchestration
- prompt assembly before model execution
- compaction and resume behavior
- structured persistence for facts and topic state

These responsibilities match the official `contextEngine` plugin slot more closely than a plain skill or `AGENTS.md` policy file.

## Relevant OpenClaw Capabilities

Official documentation indicates support for:

- plugin slots including `contextEngine`
- lifecycle hooks such as `before_prompt_build`
- memory concepts and memory file workflows
- SQLite-backed embedding cache and vector support

Primary references:

- `https://docs.openclaw.ai/tools/plugin`
- `https://docs.openclaw.ai/concepts/memory`
- `https://docs.openclaw.ai/plugins/agent-tools`
- `https://docs.openclaw.ai/plugins/manifest`

## Design Implications

### Use a plugin for orchestration

The plugin should decide what context is injected for each turn.

### Keep `AGENTS.md` small

`AGENTS.md` should define memory policy, not implement the memory engine.

### Keep Markdown as a human-readable layer

Markdown remains useful for:

- long-term curated notes
- exports
- manual inspection

It should not be the primary store for topic-aware runtime memory.

### Persist to SQLite

SQLite is the default source of truth for:

- messages
- topics
- facts
- snapshots
- topic memberships

### Cache locally by default

The default deployment should use in-process memory cache.

### Support optional Redis

Redis should be a pluggable cache backend, enabled only through explicit configuration.

Redis is not the source of truth.

## Explicit Constraint

Short summaries alone are insufficient.

The system must support structured recall of pinned facts such as:

- background
- environment
- account context
- security constraints
- long-lived project decisions

These facts need labels, scope, and recall policy so they can be pulled back even when the recent conversation window no longer contains the original raw text.
