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

When you install `@bamdra/bamdra-openclaw-memory`, the npm `postinstall` bootstrap now does all of this:

- creates the local memory directory
- installs the main continuity runtime
- auto-provisions `bamdra-user-bind`
- stages `bamdra-memory-vector`
- copies bundled skills into `~/.openclaw/skills/`
- binds the memory and context-engine slots to `bamdra-openclaw-memory`

In practice, it feels like a one-command install for the complete suite.

Note:

- use `openclaw plugins install @bamdra/bamdra-openclaw-memory` for the plugin itself
- `openclaw update` is for updating OpenClaw, not as a plugin migration hook

If you already installed an older suite version and the local state is no longer clean, do not manually delete plugin folders first. Install the standalone repair skill instead:

```bash
clawdhub --workdir ~/.openclaw --dir skills install bamdra-memory-upgrade-operator --force
```

Then let an agent use that skill to uninstall, reinstall, or upgrade the suite safely. See [Upgrade Skill](/guide/upgrade-operator).

After install, keep the prompt split clean:

- let `bamdra-user-bind` own preferred address, nickname, timezone, and other stable per-user profile fields
- keep workspace `USER.md` files thin and focused on environment facts instead of identity

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
- [Upgrade Skill](/guide/upgrade-operator)
- [Downloads](/guide/downloads)
