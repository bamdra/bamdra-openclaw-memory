# bamdra-memory Usage Guide

## Think of It as Continuity, Not as a Database Feature

The point of `bamdra-memory` is not that it gives you a few extra tool names.

The point is that conversations start to feel like working with a partner that actually stays on track:

- topic switches stop polluting the current branch
- "remember this" starts having a visible effect
- "go back to the earlier thread" becomes understandable

## A Typical Flow

Imagine you are working with OpenClaw on a project.

### Part 1: Start Topic A

You say:

> Let's work on the SQLite design for OpenClaw memory.

The system will usually treat this as one topic.

### Part 2: Detour into Topic B

Then you say:

> Now switch to Redis as an optional cache.

That usually becomes a different topic instead of polluting the SQLite branch.

### Part 3: Save a Durable Fact

Then you say:

> Remember that the main database path is `/Users/mac/.openclaw/memory/main.sqlite`.

Desired effect:

- the path is stored as a stable fact
- you do not need to repeat it later

### Part 4: Return to Topic A

Then you say:

> Go back to the SQLite branch.

Desired effect:

- the agent returns to the SQLite branch
- current context is rebuilt around SQLite
- the Redis detour stays separate

## What Tools Exist in Practice

### `memory_list_topics`

Use when:

- you want to inspect which branches already exist
- the user refers vaguely to "the earlier thread"

### `memory_switch_topic`

Use when:

- the user explicitly wants to go back to a previous branch
- the agent already knows which topic should become active

### `memory_save_fact`

Use when:

- the user says "remember this"
- a path, preference, account reference, or constraint will matter later

### `memory_compact_topic`

Use when:

- a branch changed direction significantly
- you want its summary to catch up with the new state

### `memory_search`

Use when:

- the agent suspects the answer already exists in memory
- you want to avoid asking the user to repeat a stable fact

## What Is Worth Remembering

Very good candidates:

- paths
- environment details
- account references
- security constraints
- project decisions
- long-lived preferences

Poor candidates:

- small talk
- transient intermediate wording
- raw secret values that should never be surfaced directly

## What Good Behavior Looks Like

The user should feel:

- "It actually remembers what branch we were on."
- "It did not make me repeat the path again."
- "Going back to the old topic did not mix in unrelated work."

The user should not feel:

- "It keeps narrating every tool call."
- "It is dumping internal memory fields at me."

## If You Want Better Results

Read this next:

- [Prompting Guide](./prompting.md)

The plugin connection is only half of the outcome. The rest depends on whether the agent knows when to save memory, search memory, and switch topics naturally.
