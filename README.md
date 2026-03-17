# Bamdra OpenClaw Memory Workspace

![Bamdra Animated Logo](./bamdra-openclaw-memory/docs/assets/bamdra-logo-animated.svg)

This workspace is the local umbrella repository for the Bamdra OpenClaw memory suite.

One-command install entry:

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

It contains four top-level projects:

- `bamdra-openclaw-memory/`
  The main OpenClaw memory plugin. It provides continuity-first memory, topic routing, context assembly, durable fact recall, and the unified runtime entrypoint.
- `bamdra-user-bind/`
  The identity and profile binding plugin. It resolves channel identity, stores user bindings locally, supports Feishu-oriented binding flows, and exposes admin-safe profile tools.
- `bamdra-memory-vector/`
  The optional semantic retrieval plugin. It keeps Markdown-readable memory artifacts and a lightweight local vector-style index for scoped recall.
- `bamdra-site/`
  The public-facing product website and documentation source.

## Public Repository Model

The public open-source suite is now organized around three plugin repositories:

- `bamdra-openclaw-memory`
- `bamdra-user-bind`
- `bamdra-memory-vector`

This workspace exists so those repositories can be developed together and documented together before or alongside repo split/public release work.

## Where To Start

- Main plugin docs:
  [bamdra-openclaw-memory README](/Users/wood/workspace/macmini-openclaw/openclaw-enhanced/bamdra-openclaw-memory/README.md)
- Identity plugin docs:
  [bamdra-user-bind README](/Users/wood/workspace/macmini-openclaw/openclaw-enhanced/bamdra-user-bind/README.md)
- Vector plugin docs:
  [bamdra-memory-vector README](/Users/wood/workspace/macmini-openclaw/openclaw-enhanced/bamdra-memory-vector/README.md)
- Workspace structure notes:
  [repository-structure.md](/Users/wood/workspace/macmini-openclaw/openclaw-enhanced/docs/repository-structure.md)

## Quick Commands

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
```

## Open Source Note

`bamdra-user-bind` and `bamdra-memory-vector` currently have compact source trees, but they do include their real plugin source code:

- [bamdra-user-bind/src/index.ts](/Users/wood/workspace/macmini-openclaw/openclaw-enhanced/bamdra-user-bind/src/index.ts)
- [bamdra-memory-vector/src/index.ts](/Users/wood/workspace/macmini-openclaw/openclaw-enhanced/bamdra-memory-vector/src/index.ts)

They look small because the first open-source version is intentionally shipped as single-entry, low-dependency plugins rather than spread across many internal packages.
