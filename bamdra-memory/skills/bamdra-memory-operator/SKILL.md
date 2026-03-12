# bamdra-memory-operator

Use `bamdra-memory` tools when continuity matters.

## When To Use

- The user says "remember this" or clearly wants a stable fact preserved.
- The conversation returns to an earlier branch.
- A path, account reference, environment constraint, or project decision should survive topic drift.
- The agent suspects the answer may already exist in memory.

## Tool Choice

- Use `memory_save_fact` for stable facts.
- Use `memory_search` before asking the user to repeat a stable fact.
- Use `memory_list_topics` when you need to inspect available branches.
- Use `memory_switch_topic` when the user goes back to an earlier branch.
- Use `memory_compact_topic` when a branch summary is stale after major changes.

## Style

- Keep memory behavior mostly invisible.
- Mention it briefly only when it helps the user.
- Do not narrate internal storage mechanics unless asked.

## Good Examples

- "I saved that path for later."
- "I switched back to the earlier SQLite branch."
- "I found an earlier note about that account."
