---
name: bamdra-memory-operator
description: Use bamdra-memory tools when conversational continuity matters. Trigger when the user wants something remembered, when a stable fact should survive topic drift, when the conversation likely moved to a new topic, or when earlier context should be recovered before asking the user to repeat it.
---

# Bamdra Memory Operator

Use `bamdra-memory` tools to preserve continuity without making the conversation feel mechanical.

This skill is an optional behavior layer. It improves tool judgment, but the runtime memory chain must still be provided by the plugins themselves.

## Operating Goal

Make memory feel natural:

- keep stable facts available across topic drift
- let different threads stay separated unless the user reconnects them
- recover prior context quietly when it helps
- avoid leaking unrelated memory into the current answer
- avoid narrating internal storage mechanics unless the user asks

## Decision Policy

Use semantic judgment first. Treat examples in this file as signals, not as a complete phrase list.

Prefer memory tools when one of these is true:

- the user explicitly asks to remember something
- the detail is a stable preference, identity fact, project constraint, path, account reference, environment invariant, or durable decision
- the conversation appears to return to an older thread
- the conversation appears to branch into a new thread
- the answer may already exist in memory
- the user explicitly asks to keep topics separate, resume an older branch, or start fresh

Do not reach for memory tools when one of these is true:

- the detail is transient and only matters for the current turn
- the user is casually brainstorming and has not signaled that a detail should persist
- using a tool would add noise without improving continuity or accuracy
- the request would cross agent or user boundaries that should remain isolated

## Topic Judgment

Treat topic handling as a judgment task, not a keyword trigger.

Strong signals for a new topic:

- the user explicitly says this is a new topic, wants to start over, or says earlier threads should not interfere
- the semantic center clearly shifts away from the active thread
- the user introduces a new task domain that should remain isolated from the current branch

Strong signals for returning to an old topic:

- the user references a prior subject, entity, plan, or unresolved thread
- the user asks to continue, resume, go back, or revisit something discussed earlier
- the best answer depends on facts likely stored under an older branch

When uncertain:

- prefer quiet recovery over long explanations
- prefer searching memory before asking the user to repeat themselves
- prefer keeping the current topic if there is no meaningful benefit from switching

## Tool Selection

- Use `memory_save_fact` for stable facts the user is likely to expect later.
- Use `memory_search` before asking the user to restate a stable fact or prior decision.
- Use `memory_list_topics` when you need to inspect available branches before switching.
- Use `memory_switch_topic` when the user clearly wants to move to, resume, or isolate a branch.
- Use `memory_compact_topic` after a branch has materially changed and its summary is stale.

## Privacy And Isolation

- Respect agent isolation. Do not assume another agent's branch is available unless the runtime explicitly exposes it.
- Respect user isolation. Do not retrieve or reveal information outside the current user/session boundary.
- Do not surface unrelated facts from memory just because they were found.
- If memory retrieval feels privacy-sensitive or contextually risky, narrow the search or answer conservatively.

## Working Style

- Keep memory behavior mostly invisible.
- Mention it briefly only when it helps the user trust continuity.
- Use normal conversational language rather than tool narration.
- Do not explain topic IDs, database actions, or storage internals unless asked.

## User-Facing Examples

- "I kept that preference in mind."
- "Picking up from the earlier thread, here is the next step."
- "I found an earlier note about that account."
- "Let's continue the travel thread and keep the other topic separate."
