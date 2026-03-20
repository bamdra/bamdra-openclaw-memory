# bamdra-memory Integration Guide

## Goal

Wire `bamdra-memory` into an existing OpenClaw installation without breaking other plugins.

## Plugin Roots

Add this plugin directory to your OpenClaw plugin load paths:

- `~/.openclaw/extensions/bamdra-openclaw-memory`

## Required OpenClaw Changes

Merge the following into `~/.openclaw/openclaw.json`:

1. set `plugins.enabled = true`
2. add `bamdra-openclaw-memory` to `plugins.allow`
3. add `"memory-core"` and `"memory-lancedb"` to `plugins.deny`
4. append the plugin path to `plugins.load.paths`
5. set `plugins.slots.memory = "bamdra-openclaw-memory"`
6. set `plugins.slots.contextEngine = "bamdra-openclaw-memory"` for current OpenClaw compatibility
7. add the config entry under `plugins.entries.bamdra-openclaw-memory`

Do not overwrite the whole `plugins` object if you already use other plugins.

## Local Memory Cache Example

Use:

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

This gives you:

- SQLite persistence
- in-process memory cache
- context engine activation

## Minimal Config Shape

```json
{
  "plugins": {
    "enabled": true,
    "allow": [
      "bamdra-openclaw-memory"
    ],
    "deny": [
      "memory-core",
      "memory-lancedb"
    ],
    "load": {
      "paths": [
        "~/.openclaw/extensions/bamdra-openclaw-memory"
      ]
    },
    "slots": {
      "memory": "bamdra-openclaw-memory",
      "contextEngine": "bamdra-openclaw-memory"
    },
    "entries": {
      "bamdra-openclaw-memory": {
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
      }
    }
  }
}
```

## Integration Notes

- keep SQLite as the source of truth
- restart OpenClaw after config changes
- merge carefully with existing plugin state
- keep conflicting built-in memory plugins disabled so they cannot preempt the memory slot

## Current Integration Boundary

The bundle is usable today through local plugin loading, but the runtime-facing context engine adapter is still shaped as a project-local compatibility layer. When upstream OpenClaw exposes a stable context-engine SDK surface, this adapter should be aligned to that final API.

## Next Step

After integration, continue with:

- [Usage Guide](./usage.md)
