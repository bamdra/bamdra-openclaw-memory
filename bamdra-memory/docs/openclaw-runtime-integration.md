# OpenClaw Runtime Integration

This guide wires `bamdra-memory` into a real OpenClaw install that already has other plugins enabled.

## What OpenClaw Expects

OpenClaw discovers local plugins from `plugins.load.paths`, configures them under `plugins.entries.<id>.config`, and selects the active context engine through `plugins.slots.contextEngine`.

References:

- Plugins config and discovery: <https://docs.openclaw.ai/tools/plugin>
- Plugin manifests: <https://docs.openclaw.ai/plugins/manifest>

## Local Filesystem Load

`openclaw-enhanced` uses local plugin directories rather than npm installs.

Use these plugin roots:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

Do not replace the whole `plugins` object in `~/.openclaw/openclaw.json` if you already have other plugins enabled. Merge the additional fields into the existing object.

## Recommended Merge Strategy

1. Ensure `plugins.enabled` is `true`.
2. Append new ids to `plugins.allow`:
   - `bamdra-memory-context-engine`
   - `bamdra-memory-tools`
3. Append local plugin directories to `plugins.load.paths`.
4. Set `plugins.slots.contextEngine = "bamdra-memory-context-engine"`.
5. Add `plugins.entries.bamdra-memory-context-engine`.
6. Add `plugins.entries.bamdra-memory-tools`.

## Example Overlays

Local in-memory cache:

- [openclaw.plugins.bamdra-memory.local.merge.json](../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

Redis cache enabled:

- [openclaw.plugins.bamdra-memory.redis.merge.json](../examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

Tool plugin only:

- [openclaw.plugins.bamdra-memory-tools.json](../examples/configs/openclaw.plugins.bamdra-memory-tools.json)

## Important Notes

- Keep SQLite as the source of truth even when Redis is enabled.
- Always set a dedicated Redis `keyPrefix` so cache keys do not collide with other services.
- Config changes require a gateway restart.
- Your current `~/.openclaw/openclaw.json` already has other plugin state; merge carefully instead of overwriting.

## Current Gap

The repo now matches OpenClaw’s config discovery model, but the runtime plugin entrypoints are still lightweight adapters. The next step for full production use is to align their host API calls with the final upstream plugin SDK types instead of local compatibility interfaces.
