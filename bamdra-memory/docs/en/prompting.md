# bamdra-memory Prompting Guide

## Purpose

This guide is about the human side of `bamdra-memory`: what to write in `AGENTS.md`, `SKILL.md`, and `TOOLS.md` so the agent actually uses memory well.

This is not about internals. It is about behavior.

## What Good Usage Looks Like

A good memory-enabled agent should:

- save facts when the user clearly wants something remembered
- switch topics when the user returns to an older branch
- search memory before asking the user to repeat themselves
- avoid dumping memory mechanics into every reply

## Example Effect

User:

> Remember that the staging workspace is `/srv/openclaw-staging`.

Later:

> Go back to the deployment branch. Which workspace are we using there?

Desired behavior:

- the agent does not ask again
- the agent recalls the stored path
- the response feels natural, not like a database lookup

## AGENTS.md Example

Add a short policy block like this:

```md
## Memory Usage

- When the user says "remember this", save it as durable memory.
- When the user returns to an earlier branch, switch back to the relevant topic if possible.
- Before asking the user to repeat a stable fact, search memory first.
- Keep memory behavior mostly invisible; use it to improve continuity, not to narrate mechanics.
```

The point is to describe when memory should be used, not to explain implementation details.

## SKILL.md Example

If you maintain a local memory-operator skill, keep it thin and action-oriented:

```md
# Memory Operator

Use memory tools when continuity matters.

- Use `memory_save_fact` for stable paths, preferences, environment details, account references, and constraints.
- Use `memory_search` before asking the user to repeat a fact.
- Use `memory_list_topics` and `memory_switch_topic` when the user goes back to earlier work.
- Use `memory_compact_topic` after a branch changes direction significantly.
```

Avoid re-implementing the whole memory system in prompt text.

## TOOLS.md Example

Use `TOOLS.md` for environment-specific facts that help memory write better notes:

```md
## Memory Targets

- default workspace path: /Users/mac/.openclaw/workspace-main
- staging workspace path: /srv/openclaw-staging
- preferred redis db for testing: redis://127.0.0.1:6379/0
```

This gives the agent concrete local references it can save or compare against later.

## Recommended User-Facing Style

Good:

- "I switched back to the earlier SQLite branch."
- "I kept that path in memory."
- "I found an earlier note about that account."

Bad:

- long explanations about topic IDs
- narrating every storage action
- turning normal conversation into a debug log

## Copy-Paste Workflow

1. Add the short memory policy to `AGENTS.md`.
2. Add a thin operator skill if you use skills.
3. Store environment-specific reference notes in `TOOLS.md`.
4. Let the agent use tools quietly unless the user asks for detail.
