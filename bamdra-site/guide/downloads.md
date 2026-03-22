---
title: Downloads
description: Download links and repository entry points for the Bamdra OpenClaw suite.
---

# Downloads

## Fastest path

Use the one-command install whenever possible:

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

## Release resources

- [SQLite local merge config](/downloads/openclaw.plugins.bamdra-memory.local.merge.json)
- [Full suite merge config](/downloads/openclaw.plugins.bamdra-memory.suite.merge.json)
- [Install quick note](/downloads/INSTALL.txt)

## Source and packages

- [GitHub home](https://github.com/bamdra)
- [bamdra-openclaw-memory](https://github.com/bamdra/bamdra-openclaw-memory)
- [bamdra-user-bind](https://github.com/bamdra/bamdra-user-bind)
- [bamdra-memory-vector](https://github.com/bamdra/bamdra-memory-vector)
- [Clawdhub skill: bamdra-memory-upgrade-operator](/guide/upgrade-operator)
- [npm: @bamdra/bamdra-openclaw-memory](https://www.npmjs.com/package/@bamdra/bamdra-openclaw-memory)
- [npm: @bamdra/bamdra-user-bind](https://www.npmjs.com/package/@bamdra/bamdra-user-bind)
- [npm: @bamdra/bamdra-memory-vector](https://www.npmjs.com/package/@bamdra/bamdra-memory-vector)

## Already-installed users

If your local suite is already installed and a normal reinstall is blocked by stale config or existing plugin directories, install the standalone repair skill:

```bash
clawdhub --workdir ~/.openclaw --dir skills install bamdra-memory-upgrade-operator --force
```

## Recommended order

1. install the main package
2. confirm the suite is present
3. configure private and shared knowledge roots if needed
4. start building profile, memory, and knowledge together
