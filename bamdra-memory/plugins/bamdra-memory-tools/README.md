# bamdra-memory-tools

OpenClaw plugin exposing explicit controls for `memory-v2`.

Current tools:

- `memory_save_fact`
- `memory_search`
- `memory_list_topics`
- `memory_switch_topic`
- `memory_compact_topic`

These tools delegate into the active `bamdra-memory-context-engine` instance rather than duplicating storage or routing logic.

See:

- [bamdra-memory-tools.md](/Users/mac/workspace/openclaw-enhanced/bamdra-memory/docs/bamdra-memory-tools.md)
- [openclaw-runtime-integration.md](/Users/mac/workspace/openclaw-enhanced/bamdra-memory/docs/openclaw-runtime-integration.md)
