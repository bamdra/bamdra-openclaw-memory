# bamdra-memory-context-engine

Topic-aware OpenClaw `contextEngine` plugin for memory-v2.

Current capabilities:

- route session turns into topic branches
- persist topics, memberships, facts, and session state in SQLite
- assemble prompt context from topic summaries, recent messages, and pinned facts
- compact and refresh topic summaries
- use local memory cache by default, with optional Redis cache

See:

- [architecture.md](/Users/mac/workspace/openclaw-enhanced/bamdra-memory/docs/architecture.md)
- [configuration.md](/Users/mac/workspace/openclaw-enhanced/bamdra-memory/docs/configuration.md)
- [openclaw-runtime-integration.md](/Users/mac/workspace/openclaw-enhanced/bamdra-memory/docs/openclaw-runtime-integration.md)
