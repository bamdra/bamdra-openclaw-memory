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

> We are thinking about taking a short trip in China next month.

Then:

> If we choose Chengdu, what food should we prioritize?

Then a totally different interruption appears:

> I just received a work email. Help me write a polite reply saying I can send the file tomorrow morning.

Later you continue:

> Back to the trip. Between Chengdu and Hangzhou, which city is better for a short food-focused weekend?

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

`bamdra_list_topics`, `bamdra_switch_topic`, `bamdra_save_fact`, `bamdra_compact_topic`, and `bamdra_search`
are aliases of `memory_list_topics`, `memory_switch_topic`, `memory_save_fact`, `memory_compact_topic`, and `memory_search`.

That means:

- `bamdra_*` and `memory_*` are the same tool set
- they take the same parameters
- they have the same runtime behavior
- the docs use `memory_*` as the canonical names for explanation

### What These Five Tools Actually Do

At a high level:

- `list_topics`: inspect which topic branches already exist
- `switch_topic`: move the active context to an existing branch
- `save_fact`: persist a durable fact into memory
- `compact_topic`: refresh a topic summary after the branch changed
- `search`: look up stored topics and facts before asking the user to repeat them

In practice:

- `list_topics` and `search` are mainly read operations
- `switch_topic`, `save_fact`, and `compact_topic` update runtime or SQLite state

### `memory_list_topics`

Purpose:

- list the topic branches already known for the current session
- return topic metadata such as title, summary, labels, and active state
- help the agent inspect branch structure before switching

Typical trigger conditions:

Use when:

- you want to inspect what conversation threads already exist
- the user refers vaguely to an earlier topic
- the user says "the earlier thread", "that previous branch", or "what topics do we have now?"
- the agent wants to see candidates before switching context

Avoid when:

- the conversation is just continuing normally
- the target topic is already known and no inspection is needed

### `memory_switch_topic`

Purpose:

- change the active topic for the current session
- update session state so future context assembly follows that branch
- explicitly isolate or resume a known thread

Typical trigger conditions:

Use when:

- explicit control is needed
- you do not want to rely on automatic recovery for a special case
- the user clearly says "go back to the travel thread", "switch to the earlier sqlite discussion", or "keep this as a separate branch"
- `memory_list_topics` already identified the target topic and the agent now needs to activate it

Avoid when:

- the real need is just to see whether a fact already exists; that is closer to `memory_search`
- the target topic does not exist yet and the conversation should naturally open a new branch

### `memory_save_fact`

Purpose:

- write a durable fact into SQLite-backed memory
- keep stable information available across topic drift
- support later recall for preferences, constraints, paths, environment details, account references, and decisions

Typical trigger conditions:

Use when:

- the user says "remember this"
- a path, preference, account reference, or constraint will matter later
- the agent just confirmed a stable fact that is likely to be reused
- continuity would break later if the fact is not pinned now

Avoid when:

- the content is transient small talk
- the information only matters for the current turn
- the content is a sensitive raw secret that should not be stored or surfaced directly

### `memory_compact_topic`

Purpose:

- refresh a topic summary after the branch has evolved
- recalculate the short summary, long summary, and open loops for that topic
- improve later context assembly quality for long-running branches

Typical trigger conditions:

Use when:

- a branch changed direction significantly
- you want its summary to catch up with the new state
- a topic has accumulated many turns and its summary now feels stale
- the branch is about to be resumed later and you want a cleaner summary snapshot

Avoid when:

- every turn; it is not meant to be called constantly
- the topic is still short and its summary is already current

### `memory_search`

Purpose:

- search stored topics and durable facts inside the current isolation boundary
- help the agent recover known information before asking the user to restate it
- support "search first, ask later" behavior

Typical trigger conditions:

Use when:

- the agent suspects the answer already exists in memory
- you want to avoid asking the user to repeat a stable fact
- the user asks "what did I say earlier?" or "do you still remember that preference?"
- the agent needs to recover a fact but does not yet know the exact topic id

Avoid when:

- the target topic is already known and the real need is to resume that branch
- someone tries to use it as cross-user or cross-agent retrieval, which violates isolation boundaries

## Common Trigger Sequences

In practice, these tools are often used in small combinations:

1. Resume an earlier branch:
   `memory_list_topics` -> `memory_switch_topic`
2. Preserve a stable fact:
   `memory_save_fact`
3. Recover a previously stored fact without knowing where it lives:
   `memory_search`
4. Refresh a long-running branch after it drifted:
   `memory_compact_topic`

The preferred pattern is:

- judge semantically first
- choose the smallest tool action that improves continuity
- do not turn every turn into a visible tool workflow

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

The plugin connection is only half of the outcome. The rest depends on whether the agent knows when to save memory, search memory, and recover earlier context naturally.
