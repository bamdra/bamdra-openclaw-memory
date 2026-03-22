---
name: bamdra-memory-upgrade-operator
description: Safely upgrade or reinstall the Bamdra OpenClaw memory suite when normal `openclaw plugins install` runs into stale config, existing plugin directories, or partial installs.
---

# Bamdra Memory Upgrade Operator

Use this skill when the user wants to upgrade, reinstall, or repair the Bamdra memory suite and a normal `openclaw plugins install @bamdra/bamdra-openclaw-memory` path is blocked by:

- `plugin already exists`
- `plugin not found` errors from stale `openclaw.json`
- old bundled skills preventing new skill files from being copied
- partial installs where `bamdra-openclaw-memory`, `bamdra-user-bind`, and `bamdra-memory-vector` are out of sync

## Operating Goal

Perform a safe in-place suite upgrade without leaving `~/.openclaw/openclaw.json` broken.

The bundled script does four things in one flow:

1. backs up the current config and plugin/skill directories
2. removes stale Bamdra plugin references from `openclaw.json`
3. moves old plugin and bundled skill directories out of the way
4. runs `openclaw plugins install @bamdra/bamdra-openclaw-memory`

If install fails, the script restores the old config and moved directories.

## Default Command

Run:

```bash
node ./scripts/upgrade-bamdra-memory.cjs
```

From this skill directory, that upgrades to the latest published `@bamdra/bamdra-openclaw-memory`.

## Optional Flags

- `--package <npm-spec>` to install a specific version such as `@bamdra/bamdra-openclaw-memory@0.3.17`
- `--openclaw-home <path>` to target a non-default OpenClaw home
- `--restart-gateway` to restart the gateway after a successful install

## Behavior Rules

- prefer the script over ad-hoc manual deletion
- mention the backup directory after success
- after success, remind the user to restart OpenClaw if `--restart-gateway` was not used
- do not manually edit unrelated plugin config while doing this upgrade
- do not delete backup directories unless the user explicitly asks

## User-Facing Examples

- “升级一下 bamdra memory 套件”
- “修复 openclaw plugins install 时的 plugin already exists”
- “重新安装 bamdra-openclaw-memory，但不要把 openclaw.json 弄坏”
