# bamdra-memory-operator

Use `bamdra-memory` tools when continuity matters.

## When To Use

- The user says "remember this" or clearly wants a stable fact preserved.
- The conversation naturally returns to an earlier thread.
- A path, account reference, environment constraint, or project decision should survive topic drift.
- The agent suspects the answer may already exist in memory.

## Tool Choice

- Use `memory_save_fact` for stable facts.
- Use `memory_search` before asking the user to repeat a stable fact.
- Use `memory_list_topics` when explicit inspection is needed.
- Use `memory_switch_topic` when explicit control is needed.
- Use `memory_compact_topic` when a branch summary is stale after major changes.

## Style

- Keep memory behavior mostly invisible.
- Mention it briefly only when it helps the user.
- Do not narrate internal storage mechanics unless asked.

## Good Examples

- "I saved that path for later."
- "I kept the earlier context in mind."
- "I found an earlier note about that account."
