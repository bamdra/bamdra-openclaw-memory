# bamdra-memory Integration Guide

## Goal

Wire `bamdra-memory` into an existing OpenClaw installation without breaking other plugins.

## Plugin Roots

Add these plugin directories to your OpenClaw plugin load paths:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

## Required OpenClaw Changes

Merge the following into `~/.openclaw/openclaw.json`:

1. set `plugins.enabled = true`
2. add `bamdra-memory-context-engine` to `plugins.allow`
3. optionally add `bamdra-memory-tools` to `plugins.allow`
4. append both plugin paths to `plugins.load.paths`
5. set `plugins.slots.contextEngine = "bamdra-memory-context-engine"`
6. add config entries under `plugins.entries`

Do not overwrite the whole `plugins` object if you already use other plugins.

## Local Memory Cache Example

Use:

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

This gives you:

- SQLite persistence
- in-process memory cache
- context engine activation

## Redis Cache Example

Use:

- [openclaw.plugins.bamdra-memory.redis.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

This gives you:

- SQLite as the source of truth
- Redis for hot cache state
- tool plugin enabled

## Tools-Only Overlay

If you only need the tool plugin overlay:

- [openclaw.plugins.bamdra-memory-tools.json](../../examples/configs/openclaw.plugins.bamdra-memory-tools.json)

## Minimal Config Shape

```json
{
  "plugins": {
    "enabled": true,
    "allow": [
      "bamdra-memory-context-engine",
      "bamdra-memory-tools"
    ],
    "load": {
      "paths": [
        "~/.openclaw/extensions/bamdra-memory-context-engine",
        "~/.openclaw/extensions/bamdra-memory-tools"
      ]
    },
    "slots": {
      "contextEngine": "bamdra-memory-context-engine"
    },
    "entries": {
      "bamdra-memory-context-engine": {
        "enabled": true,
        "config": {
          "enabled": true,
          "store": {
            "provider": "sqlite",
            "path": "~/.openclaw/memory/main.sqlite"
          },
          "cache": {
            "provider": "memory",
            "maxSessions": 128
          }
        }
      },
      "bamdra-memory-tools": {
        "enabled": true,
        "config": {}
      }
    }
  }
}
```

## Integration Notes

- keep SQLite as the source of truth
- use a dedicated Redis `keyPrefix` if Redis is enabled
- restart OpenClaw after config changes
- merge carefully with existing plugin state

## Current Integration Boundary

The bundle is usable today through local plugin loading, but the runtime-facing context engine adapter is still shaped as a project-local compatibility layer. When upstream OpenClaw exposes a stable context-engine SDK surface, this adapter should be aligned to that final API.

## Next Step

After integration, continue with:

- [Usage Guide](./usage.md)
