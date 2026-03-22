---
title: bamdra-memory-vector
description: Learn how the vector plugin turns local Markdown into a real knowledge base for OpenClaw.
---

# bamdra-memory-vector

## What it is

`bamdra-memory-vector` is the local knowledge and semantic retrieval layer of the suite.

It can run independently, but it becomes most valuable when paired with `bamdra-openclaw-memory`.

## What problem it solves

Continuity alone is not enough.

Teams also need a way to:

- keep knowledge readable
- edit it outside the runtime
- retrieve it when wording is fuzzy
- avoid paying the cost of unnecessary web search

That is the gap this plugin closes.

## Core capabilities

- filesystem-backed local knowledge roots
- private and shared Markdown separation
- semantic recall for fuzzy questions
- local-first retrieval before web search
- automatic indexing of `knowledge/`, `docs/`, `notes/`, and `ideas/`
- support for alternative idea buckets such as `06_Interest/` in numbered Obsidian vault layouts

## Best-practice knowledge layout

Recommended structure:

```text
private/
  knowledge/
  docs/
  notes/
  ideas/

shared/
  knowledge/
  docs/
  notes/
  ideas/
```

Suggested interpretation:

- `knowledge/` for stable reusable knowledge
- `docs/` for formal documentation, references, and changelogs
- `notes/` for meeting notes and process-heavy records
- `ideas/` for unfinished but worth-searching thinking
- if your vault uses numbered folders, `06_Interest/` can serve the same role as `ideas/`
- `_runtime/` for system-managed generated files

## Best-practice storage setup

Keep the index local, but move the Markdown roots to a synced folder.

Example:

```json
{
  "enabled": true,
  "privateMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/private",
  "sharedMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/shared",
  "indexPath": "~/.openclaw/memory/vector/index.json"
}
```

This is ideal when you want:

- Obsidian editing
- iCloud or Syncthing sync
- Git-backed doc management
- local retrieval speed without remote vector infrastructure

## What makes it special

This plugin is not trying to be a heavy external vector stack.

Its strength is that it makes the knowledge base:

- local
- readable
- editable
- user-aware
- practical for everyday work

## Ideal usage pattern

The best flow is:

1. write and organize knowledge as Markdown
2. let the plugin index those files locally
3. let OpenClaw search local knowledge before falling back to the web
4. keep private and shared roots deliberately separated

## What it unlocks with the rest of the suite

With `bamdra-openclaw-memory`:

- fuzzy old decisions become easier to recover
- local docs can enter recall without prompt bloat

With `bamdra-user-bind`:

- private knowledge remains user-bounded
- local recall can respect identity and privacy boundaries

## Repositories

- [GitHub home](https://github.com/bamdra)
- [Repository](https://github.com/bamdra/bamdra-memory-vector)
