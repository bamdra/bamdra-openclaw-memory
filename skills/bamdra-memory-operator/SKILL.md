---
name: bamdra-memory-operator
description: Use bamdra-memory so OpenClaw can remember important facts, switch back to earlier topics, and avoid making users repeat themselves.
---

# Bamdra Memory Operator

Use `bamdra-openclaw-memory` tools to preserve continuity without making the conversation feel mechanical.

This skill is an optional behavior layer. It improves tool judgment, but the runtime memory chain must still be provided by the plugins themselves.

Treat `bamdra-user-bind` as the primary user personalization layer. In practice it should cover most of what a per-user `USER.md` file would normally do: preferred address, long-lived preferences, role, personality notes, and other stable profile traits for the current bound user.

## Operating Goal

Make memory feel natural:

- keep stable facts available across topic drift
- let different threads stay separated unless the user reconnects them
- recover prior context quietly when it helps
- avoid leaking unrelated memory into the current answer
- avoid narrating internal storage mechanics unless the user asks
- personalize tone and defaults from the bound user profile when that improves the response

## Decision Policy

Use semantic judgment first. Treat examples in this file as signals, not as a complete phrase list.

Prefer memory tools when one of these is true:

- the user explicitly asks to remember something
- the detail is a stable preference, identity fact, project constraint, path, account reference, environment invariant, or durable decision
- the conversation appears to return to an older thread
- the conversation appears to branch into a new thread
- the answer may already exist in memory
- the user explicitly asks to keep topics separate, resume an older branch, or start fresh
- the answer should adapt to a stable user preference or role that is likely already in the bound profile

Do not reach for memory tools when one of these is true:

- the detail is transient and only matters for the current turn
- the user is casually brainstorming and has not signaled that a detail should persist
- using a tool would add noise without improving continuity or accuracy
- the request would cross agent or user boundaries that should remain isolated
- the profile signal is already sufficient and an extra memory lookup would only add noise

## User Profile Policy

Treat the bound user profile as the first personalization source for the current user.

Use it for:

- preferred form of address
- stable output preferences such as tone, structure, formatting, or brevity
- role-aware defaults such as whether to optimize for management summaries, technical detail, or documentation quality
- personality or collaboration style cues when they improve phrasing

Do not use it for:

- making up facts that are not actually present in the bound profile
- inferring private details about other users
- overriding an explicit instruction the user gives in the current turn

If the current turn conflicts with the stored profile, follow the current turn and let later updates refresh the profile deliberately.

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

- Use `bamdra_memory_save_fact` for stable facts the user is likely to expect later.
- Use `bamdra_memory_search` before asking the user to restate a stable fact or prior decision.
- Use `bamdra_memory_list_topics` when you need to inspect available branches before switching.
- Use `bamdra_memory_switch_topic` when the user clearly wants to move to, resume, or isolate a branch.
- Use `bamdra_memory_compact_topic` after a branch has materially changed and its summary is stale.

If `bamdra-memory-vector` is enabled, treat `bamdra_memory_search` as a hybrid recall entrypoint rather than a pure keyword lookup. Use it especially when:

- the user references something fuzzily
- the user says “之前提过”, “你还记得吗”, “知识库里有没有”
- the answer may live in shared Markdown knowledge, not only session memory

When the user asks about something that plausibly exists in local knowledge files, private notes, team docs, or shared Markdown, prefer `bamdra_memory_search` before any web or external search. Only go to the web first when the user explicitly wants latest public information or when local recall is clearly insufficient.

For knowledge-oriented requests, this is the default order:

1. local `bamdra_memory_search`
2. answer from local recall if it is good enough
3. only then consider web search

Do not skip step 1 just because the user says “查一下”, “最新”, or “帮我看看”. If the subject looks like a local changelog, README, notes folder, docs tree, private knowledge, or shared knowledge base entry, check local recall first.

## Privacy And Isolation

- Respect agent isolation. Do not assume another agent's branch is available unless the runtime explicitly exposes it.
- Respect user isolation. Do not retrieve or reveal information outside the current user/session boundary.
- Do not surface unrelated facts from memory just because they were found.
- If memory retrieval feels privacy-sensitive or contextually risky, narrow the search or answer conservatively.
- Treat `bamdra-user-bind` profile data as private-by-default user context, not as a global team directory.

## Scope Rules

Use `shared` only for genuinely reusable public knowledge.

Good `shared` examples:

- team conventions
- reusable SOPs
- public project templates
- shared knowledge base entries
- information the user explicitly says should be shared

Keep these private by default and prefer `user:` scope or `bamdra-user-bind` profile updates:

- preferred form of address
- timezone
- tone and formatting preferences
- pets, family, role, and personal background
- the user's current focus, ongoing work, and long-lived personal goals

When a fact is about “me”, “my”, or the current user's own stable way of working, do not store it as `shared` unless the user explicitly says it is a shared rule for everyone.

## Working Style

- Keep memory behavior mostly invisible.
- Mention it briefly only when it helps the user trust continuity.
- Use normal conversational language rather than tool narration.
- Do not explain topic IDs, database actions, or storage internals unless asked.
- Let personalization feel natural. The user should experience it as “you remembered me”, not as “you loaded my profile record”.

## User-Facing Examples

- "I kept that preference in mind."
- "Picking up from the earlier thread, here is the next step."
- "I found an earlier note about that account."
- "Let's continue the travel thread and keep the other topic separate."
