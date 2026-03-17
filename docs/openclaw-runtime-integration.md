# OpenClaw Runtime Integration

This guide wires `bamdra-memory` into a real OpenClaw install that already has other plugins enabled.

## What OpenClaw Expects

OpenClaw discovers local plugins from `plugins.load.paths`, configures them under `plugins.entries.<id>.config`, and selects the active memory engine through the plugin slot configuration.

References:

- Plugins config and discovery: <https://docs.openclaw.ai/tools/plugin>
- Plugin manifests: <https://docs.openclaw.ai/plugins/manifest>

## Local Filesystem Load

`openclaw-enhanced` uses local plugin directories rather than npm installs.

Use this plugin root:

- `~/.openclaw/extensions/bamdra-openclaw-memory`

Do not replace the whole `plugins` object in `~/.openclaw/openclaw.json` if you already have other plugins enabled. Merge the additional fields into the existing object.

## Recommended Merge Strategy

1. Ensure `plugins.enabled` is `true`.
2. Append `bamdra-openclaw-memory` to `plugins.allow`.
3. Add `bamdra-openclaw-memory` to `plugins.load.paths`.
4. Set `plugins.slots.contextEngine = "bamdra-openclaw-memory"`.
5. Set `plugins.slots.memory = "bamdra-openclaw-memory"`.
6. Add `"memory-core"` to `plugins.deny`.
7. Add `plugins.entries.bamdra-openclaw-memory`.

## Example Overlays

Local in-memory cache:

- [openclaw.plugins.bamdra-memory.local.merge.json](../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

## Important Notes

- Config changes require a gateway restart.
- Your current `~/.openclaw/openclaw.json` already has other plugin state; merge carefully instead of overwriting.
- In current OpenClaw builds, setting both `plugins.slots.memory` and `plugins.slots.contextEngine` is the safest compatibility choice.
- If `memory-core` is still enabled, it can preempt the slot and disable the third-party engine even when the plugin is loaded.

## Runtime Hardening

The current bundle includes a few defensive behaviors that matter in production:

- the unified plugin explicitly registers its tools instead of relying on discovery side effects
- the unified plugin owns both the memory slot and the explicit tool aliases in one runtime entrypoint
- the context engine can recover from partial runtime config and still resolve the SQLite path

## Scope Boundary

`bamdra-memory` is for continuity inside the correct conversation boundary.

- do not treat it as cross-user shared memory
- do not use it to bypass agent isolation
- topic recovery should happen inside a single session, not across unrelated sessions

## Current Gap

The repo now matches OpenClaw’s config discovery model, but the runtime plugin entrypoints are still lightweight adapters. The next step for full production use is to align their host API calls with the final upstream plugin SDK types instead of local compatibility interfaces.
