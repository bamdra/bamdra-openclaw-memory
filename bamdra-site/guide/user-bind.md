---
title: bamdra-user-bind
description: Learn how the identity and profile plugin works, why it matters, and how to use it safely.
---

# bamdra-user-bind

## What it is

`bamdra-user-bind` is the identity and profile layer of the suite.

It can run independently, but it becomes especially powerful when paired with `bamdra-openclaw-memory`.

## What problem it solves

Many runtimes only expose raw channel sender IDs.

That creates three problems:

- the same real person can appear as multiple identities
- memory boundaries become unstable
- personalization becomes brittle and short-lived

`bamdra-user-bind` solves this by giving the runtime a stable user model.

## Core capabilities

- channel-aware identity resolution
- Feishu-oriented identity lookup
- local SQLite profile storage
- editable per-user Markdown mirrors
- admin-safe natural-language operations
- runtime profile injection

## Why it is surprising in practice

This plugin is not only about mapping `OpenID -> UserID`.

It also becomes the user's living profile layer:

- preferred form of address
- timezone
- tone preferences
- role and collaboration style
- long-lived notes about how the user likes to work

That means it replaces most of the usual `USER.md` burden for per-user behavior.

## Best-practice use

### Use SQLite as the controlled source of truth

Keep the runtime store here:

```text
~/.openclaw/data/bamdra-user-bind/profiles.sqlite
```

### Let humans edit the Markdown mirror

Use the per-user mirror like this:

```text
~/.openclaw/data/bamdra-user-bind/profiles/private/{userId}.md
```

Or move it to a synced folder, such as a private Obsidian vault.

The mirror now has a clearer split:

- frontmatter is the machine-readable source the runtime reads and writes
- `Confirmed Profile` in the body is the human-readable mirror of the same structured fields
- `Supplementary Notes` are for durable context that does not fit cleanly into structured fields

### Keep the mirror private

The profile mirror should stay outside unrestricted shared knowledge scanning.

That way:

- humans can edit it
- agents cannot enumerate everyone
- the runtime still has a safe controlled source of truth

## Ideal usage pattern

The best pattern is:

1. let the plugin resolve the user automatically
2. let the user edit the profile Markdown gradually
3. let the runtime inject those preferences into future sessions
4. use admin tools only for correction, merge, audit, and repair

## Profile update semantics

Profile updates are no longer limited to blind replacement.

The runtime now supports three semantic operations when stable user traits change:

- `replace`: the user is correcting or changing an existing durable preference
- `append`: the user is adding another durable trait without revoking the old one
- `remove`: the user explicitly wants one old preference or trait removed

This is especially important for `preferences`, `personality`, and `notes`, where the correct action is often incremental.

## Channel-scoped identities and provisional merge

The runtime now keeps user boundaries channel-scoped so profile ownership stays explicit across supported connectors such as Feishu, Telegram, WhatsApp, Discord, Google Chat, Slack, Mattermost, Signal, iMessage, and Microsoft Teams.

When a stable binding is temporarily unavailable, the runtime can still:

- persist a provisional profile first
- keep trying to repair the binding in the background
- merge that provisional profile into the stable user profile once the binding is recovered

This avoids dropping durable user preferences just because identity repair lagged behind the first message.

## What it unlocks with the rest of the suite

With `bamdra-openclaw-memory`:

- long-lived facts become user-aware instead of session-only
- personalization survives new sessions and restarts

With `bamdra-memory-vector`:

- private profile-adjacent notes can influence local recall
- private and shared knowledge stay separated

## Admin tools

The plugin ships separate admin skills and tools so administrators can:

- inspect a profile
- edit fields in natural language
- merge duplicate bindings
- list issues
- trigger sync and repair flows

This is intentionally separate from ordinary user access.

## Repositories

- [GitHub home](https://github.com/bamdra)
- [Repository](https://github.com/bamdra/bamdra-user-bind)
