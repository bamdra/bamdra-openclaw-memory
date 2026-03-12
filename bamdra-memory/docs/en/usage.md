# bamdra-memory Usage Guide

## Think of It as Continuity, Not as a Database Feature

The point of `bamdra-memory` is not that it gives you a few extra tool names.

The point is that conversations start to feel like working with a partner that actually stays on track:

- interruptions stop polluting the earlier conversation
- "remember this" starts having a visible effect
- returning to an earlier subject becomes natural

## A Typical Flow

Imagine a more everyday conversation.

### Implicit Topic Recovery

You say:

> We are thinking about where to travel next month.

Then:

> If we choose Osaka, what food should we prioritize?

Then a totally different interruption appears:

> I just received a work email. Help me write a polite reply saying I can send the file tomorrow morning.

Later you continue:

> Back to the trip. Between Osaka and Kyoto, which city is better for a short food-focused weekend?

Desired effect:

- the travel conversation still feels intact
- the food sub-thread stays attached to the travel topic
- the work-email interruption does not pollute the later travel answer

### Explicit Memory Save

You also say:

> Please remember that I prefer window seats on trains.

Desired effect:

- the preference can be reused later
- you do not need to repeat it when travel planning continues

## What Tools Exist in Practice

### `memory_list_topics`

Use when:

- you want to inspect what conversation threads already exist
- the user refers vaguely to an earlier topic

### `memory_switch_topic`

Use when:

- explicit control is needed
- you do not want to rely on automatic recovery for a special case

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

- "It actually remembers what we were talking about."
- "It did not make me repeat my preference again."
- "After the interruption, it still answered in the right context."

The user should not feel:

- "It keeps narrating every tool call."
- "It is dumping internal memory fields at me."

## If You Want Better Results

Read this next:

- [Prompting Guide](./prompting.md)

The plugin connection is only half of the outcome. The rest depends on whether the agent knows when to save memory, search memory, and switch topics naturally.
