---
title: Installation
description: Install the Bamdra OpenClaw suite with one command and understand what happens automatically.
---

# Installation

## Recommended install

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

This is the recommended path.

## What happens automatically

When you install `@bamdra/bamdra-openclaw-memory`, the bootstrap now does all of this:

- creates the local memory directory
- installs the main continuity runtime
- auto-provisions `bamdra-user-bind`
- stages `bamdra-memory-vector`
- copies bundled skills into `~/.openclaw/skills/`
- binds the memory and context-engine slots to `bamdra-openclaw-memory`

In practice, it feels like a one-command install for the complete suite.

## Why this matters

Users should not need to:

- run a second install just to get identity binding
- manually create the memory directory
- discover later that the knowledge layer was never prepared

The install flow should feel productized, not stitched together.

## What you should do after install

### 1. Restart OpenClaw

Config changes require a gateway restart.

### 2. Confirm the plugins are present

OpenClaw should now have:

- `bamdra-openclaw-memory`
- `bamdra-user-bind`
- `bamdra-memory-vector`

### 3. Decide where your knowledge base should live

Recommended:

- keep SQLite and the index inside `~/.openclaw`
- point Markdown roots to a folder you already sync and edit, such as Obsidian

Example:

```json
{
  "plugins": {
    "entries": {
      "bamdra-memory-vector": {
        "enabled": true,
        "config": {
          "enabled": true,
          "privateMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/private",
          "sharedMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/shared",
          "indexPath": "~/.openclaw/memory/vector/index.json"
        }
      }
    }
  }
}
```

## Manual install

If npm-based plugin install is unavailable, you can still use the release package.

1. download the release
2. copy `bamdra-openclaw-memory` into `~/.openclaw/extensions/`
3. optionally copy `bamdra-user-bind` and `bamdra-memory-vector`
4. merge the sample config
5. restart OpenClaw

## What success looks like

After installation:

- the assistant keeps the right branch alive after interruptions
- stable facts can be reused later
- the current user gets consistent personalization
- local docs and notes can enter the recall path before web search

## Next reading

- [Architecture](/guide/architecture)
- [Best Practices](/guide/best-practices)
- [Downloads](/guide/downloads)
