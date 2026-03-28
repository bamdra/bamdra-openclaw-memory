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

Recent profile behavior improvements:

- profile updates now support semantic `replace`, `append`, and `remove` instead of only blind overwrite
- the Markdown mirror keeps machine-readable frontmatter as the controlled source
- the `Confirmed Profile` section in the body is now a human-readable mirror of the same structured fields

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

## Profile update semantics

`bamdra-user-bind` no longer treats every profile change as a full replacement.

When the user says something new about how they prefer to collaborate, the runtime now distinguishes between:

- replacing an old preference
- appending another stable preference
- removing one specific old preference

This matters for fields like `preferences`, `personality`, and `notes`, where the right behavior is often incremental rather than destructive.

The Markdown mirror is also clearer now:

- frontmatter remains the machine-readable source of truth
- the body shows a synchronized human-readable summary
- `Supplementary Notes` are reserved for durable context that does not fit the structured fields

## Repository map

- [Installation guide](./docs/en/installation.md)
- [Prompting guide](./docs/en/prompting.md)
- [Example config](./examples/configs/openclaw.plugins.bamdra-memory.suite.merge.json)
- [Standalone upgrade skill](./plugins/bamdra-memory/skills/bamdra-memory-upgrade-operator/SKILL.md)
- [GitHub organization](https://github.com/bamdra)
