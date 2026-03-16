# Tools Memory V2 Manifest Draft

## Goal

Provide a minimal manifest shape for wiring `bamdra-memory-tools` into OpenClaw in a way that matches the official manifest rules more closely.

## Draft Shape

Official docs require a plugin-root `openclaw.plugin.json` with at least:

- `id`
- `configSchema`

Current repository manifests:

- `bamdra-memory/plugins/bamdra-memory-context-engine/openclaw.plugin.json`
- `bamdra-memory/plugins/bamdra-memory-tools/openclaw.plugin.json`

The tool parameter contracts remain documented separately in:

- `bamdra-memory/schemas/bamdra-memory-tools.schema.json`

## Wiring Strategy

The intended wiring model is:

1. OpenClaw loads the `bamdra-memory-context-engine` plugin from `plugins.load.paths`.
2. OpenClaw selects it via `plugins.slots.contextEngine`.
3. OpenClaw loads `bamdra-memory-tools` via `plugins.entries`.
4. `bamdra-memory-tools` delegates tool calls into the running context engine:
   - `listTopics(sessionId)`
   - `switchTopic(sessionId, topicId)`
   - `saveFact(...)`
   - `compactTopic(...)`
   - `searchMemory(...)`

## Notes

- Official references:
  - `https://docs.openclaw.ai/plugins/manifest`
  - `https://docs.openclaw.ai/plugins/agent-tools`
- The current runtime entry files are scaffolds:
  - `bamdra-memory/plugins/bamdra-memory-context-engine/src/plugin.ts`
  - `bamdra-memory/plugins/bamdra-memory-tools/src/plugin.ts`
