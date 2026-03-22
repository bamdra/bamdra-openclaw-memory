# bamdra-memory Prompting Guide

## Purpose

This guide is about the human side of `bamdra-memory`: what to write in `AGENTS.md`, `SKILL.md`, and `TOOLS.md` so the agent actually uses memory well.

This is not about internals. It is about behavior.

## What Good Usage Looks Like

A good memory-enabled agent should:

- save facts when the user clearly wants something remembered
- recover earlier threads quietly when the conversation returns there
- search memory before asking the user to repeat themselves
- avoid dumping memory mechanics into every reply

## Example Effect

Conversation:

> We were talking about a short trip in China.
> If we go to Chengdu, what should we eat?
> I just got a work email. Help me answer it politely.
> Back to the trip. Which city is better for a short food weekend, Chengdu or Hangzhou?

Desired behavior:

- the agent does not explain any internal switching
- it simply answers in the correct travel context
- the response feels natural, not like a database lookup

## AGENTS.md Example

Add a short policy block like this:

```md
## Memory Usage

- When the user says "remember this", save it as durable memory.
- When the conversation naturally returns to an earlier thread, recover the relevant context quietly if possible.
- Before asking the user to repeat a stable fact, search memory first.
- Keep memory behavior mostly invisible; use it to improve continuity, not to narrate mechanics.
```

The point is to describe when memory should be used, not to explain implementation details.

## USER.md And User-Bind

If you install the full suite, treat `bamdra-user-bind` as the primary per-user profile layer.

- keep preferred address, nickname, timezone, tone defaults, and other stable user traits in the bound profile
- keep workspace `USER.md` thin and focused on environment facts, operating context, or team-wide constraints
- if the current turn explicitly asks for a different form of address, follow the current turn first

In other words, `USER.md` should not be the long-term source of truth for who this user is. That belongs in `bamdra-user-bind`.

## SKILL.md Example

If you maintain a local memory-operator skill, keep it thin, but make the decision policy explicit instead of turning it into a mere tool list.

This is an optional behavioral layer, not a runtime requirement for `bamdra-memory` itself. The plugin bundle ships a recommended copy, but current OpenClaw builds still require explicit `agent.skills` binding:

```md
---
name: memory-operator
description: Use memory tools when continuity matters; make semantic judgments when the conversation may switch topics, return to an older thread, or depend on stable facts.
---

# Memory Operator

Use memory tools when continuity matters and keep continuity natural.

- Make a semantic judgment first; do not rely on phrase matching alone.
- Use `memory_save_fact` for stable paths, preferences, environment details, account references, constraints, and durable decisions.
- Use `memory_search` before asking the user to repeat a stable fact.
- Use `memory_list_topics` and `memory_switch_topic` when the user clearly wants to move to, resume, or isolate a topic branch.
- Use `memory_compact_topic` after a branch changes direction significantly.
- Respect agent and user isolation boundaries when retrieving memory.
```

Avoid re-implementing the whole memory system in prompt text, and avoid trying to enumerate every possible user phrasing for topic shifts.

## Best Practice

The more reliable pattern is:

- let the plugins provide the verifiable memory infrastructure
- let the skill teach the agent when a message likely means "new topic", "resume old topic", or "save this for later"
- keep hard-coded rules small and use them only as a fallback

A more AI-native memory skill should:

- infer topic shifts from semantic change, not only from fixed phrases
- recover older context quietly when it helps
- search memory before asking the user to restate stable facts
- avoid pulling unrelated memory into the current answer
- preserve isolation boundaries even when continuity would be convenient

If you want a recommended operator skill, start from:

- [`skills/bamdra-memory-operator/SKILL.md`](../../skills/bamdra-memory-operator/SKILL.md)

## TOOLS.md Example

Use `TOOLS.md` only for environment-specific facts that help memory write better notes:

```md
## Memory Targets

- default workspace path: ~/.openclaw/workspace
- preferred extensions path: ~/.openclaw/extensions
```

This gives the agent concrete local references it can save or compare against later.

Do not use `TOOLS.md` as a skill registry, authorization list, or replacement for `SKILL.md`. Tool definitions, usage rules, and command patterns belong in `SKILL.md`.

## Recommended User-Facing Style

Good:

- "I kept that preference in mind."
- "Based on what we were discussing earlier, Chengdu fits better."
- "I found an earlier note about that account."

Bad:

- long explanations about topic IDs
- narrating every storage action
- turning normal conversation into a debug log

## Copy-Paste Workflow

1. Add the short memory policy to `AGENTS.md`.
2. Add a thin operator skill only if you want more reliable memory-tool behavior, and keep the focus on decision policy rather than command narration.
3. Store environment-specific reference notes in `TOOLS.md`, not capability definitions.
4. Let the agent use tools quietly unless the user asks for detail.
5. Write isolation boundaries into the prompt policy so continuity does not become overreach.
