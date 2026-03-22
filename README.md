# bamdra-openclaw-memory

![Bamdra Animated Logo](./docs/assets/bamdra-logo-animated.svg)

The continuity-first memory runtime for OpenClaw.

Install once:

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

That single install now prepares the full Bamdra memory stack:

- `bamdra-openclaw-memory`
- `bamdra-user-bind`
- `bamdra-memory-vector`

If you already have an older or broken local install, use the standalone Clawdhub repair skill:

```bash
clawdhub --workdir ~/.openclaw --dir skills install bamdra-memory-upgrade-operator --force
```

[中文文档](./README.zh-CN.md)

## What it is

`bamdra-openclaw-memory` is the main runtime plugin in the Bamdra suite.

It helps OpenClaw:

- keep the right topic branch alive
- store durable facts
- assemble compact prompt context
- recover after interruptions and restarts
- work with a real identity layer and a real local knowledge base

## Why teams install it

Without a continuity runtime, long OpenClaw sessions break down fast:

- users repeat the same background
- interruptions destroy flow
- stable decisions sink into chat history
- local docs and notes are not part of the recall path

With this suite, the assistant can gradually evolve with the user because profile, memory, and knowledge all become durable.

## What makes the suite complete

### `bamdra-user-bind`

Adds the stable user boundary and living profile layer.

It covers most of what a per-user `USER.md` would usually try to do:

- preferred address
- timezone
- tone preferences
- role and collaboration style
- long-lived user notes

### `bamdra-memory-vector`

Turns local Markdown into a real knowledge base.

It indexes:

- `knowledge/`
- `docs/`
- `notes/`
- `ideas/`

and makes local recall happen before unnecessary web lookup.

## Architecture

![Bamdra Suite Architecture](./docs/assets/architecture-technical-en.svg)

## Best-practice setup

Use the suite like this:

- let `bamdra-openclaw-memory` own the `memory` and `contextEngine` slots
- let `bamdra-user-bind` own identity and personalization
- let `bamdra-memory-vector` own local Markdown knowledge and semantic recall

Recommended vector roots:

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

That gives you:

- a local-first memory runtime
- a living user profile
- a maintainable private and shared knowledge base

## Repository map

- [Installation guide](./docs/en/installation.md)
- [Prompting guide](./docs/en/prompting.md)
- [Example config](./examples/configs/openclaw.plugins.bamdra-memory.suite.merge.json)
- [Standalone upgrade skill](../clawhub-skills/bamdra-memory-upgrade-operator/SKILL.md)
- [GitHub organization](https://github.com/bamdra)
