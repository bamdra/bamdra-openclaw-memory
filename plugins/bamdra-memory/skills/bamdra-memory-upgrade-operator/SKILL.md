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

Follow this manual flow:

1. create a backup directory under `~/.openclaw/backups/` with a timestamped name
2. copy `~/.openclaw/openclaw.json` into that backup directory before changing anything
3. move any existing Bamdra plugin directories out of `~/.openclaw/extensions/`
4. move any existing Bamdra bundled skill directories out of `~/.openclaw/skills/`
5. remove stale Bamdra plugin references from `openclaw.json`
6. run `openclaw plugins install @bamdra/bamdra-openclaw-memory`
7. restart the OpenClaw gateway after a successful install

If install fails, restore the saved `openclaw.json` and move the backed-up plugin and skill directories back into place.

## Manual Repair Checklist

Use these IDs when cleaning up stale state:

- plugin directories: `bamdra-openclaw-memory`, `bamdra-user-bind`, `bamdra-memory-vector`
- skill directories: `bamdra-memory-operator`, `bamdra-memory-upgrade-operator`, `bamdra-user-bind-profile`, `bamdra-user-bind-admin`, `bamdra-memory-vector-operator`
- plugin slots to clear if they still point at old Bamdra entries: `memory`, `contextEngine`

Remove these tool names from `tools.allow` if they are present before reinstall:

- `bamdra_memory_list_topics`
- `bamdra_memory_switch_topic`
- `bamdra_memory_save_fact`
- `bamdra_memory_compact_topic`
- `bamdra_memory_search`
- `bamdra_user_bind_get_my_profile`
- `bamdra_user_bind_update_my_profile`
- `bamdra_user_bind_refresh_my_binding`
- `bamdra_user_bind_admin_query`
- `bamdra_user_bind_admin_edit`
- `bamdra_user_bind_admin_merge`
- `bamdra_user_bind_admin_list_issues`
- `bamdra_user_bind_admin_sync`
- `bamdra_memory_vector_search`
- `memory_list_topics`
- `memory_switch_topic`
- `memory_save_fact`
- `memory_compact_topic`
- `memory_search`
- `user_bind_get_my_profile`
- `user_bind_update_my_profile`
- `user_bind_refresh_my_binding`
- `user_bind_admin_query`
- `user_bind_admin_edit`
- `user_bind_admin_merge`
- `user_bind_admin_list_issues`
- `user_bind_admin_sync`
- `memory_vector_search`

When the user wants a specific version, install that explicit npm spec instead of `@bamdra/bamdra-openclaw-memory`.

## Behavior Rules

- prefer this backup-first checklist over ad-hoc manual deletion
- mention the backup directory after success
- after success, remind the user to restart OpenClaw if the gateway was not restarted during the repair
- do not manually edit unrelated plugin config while doing this upgrade
- do not delete backup directories unless the user explicitly asks

## User-Facing Examples

- “升级一下 bamdra memory 套件”
- “修复 openclaw plugins install 时的 plugin already exists”
- “重新安装 bamdra-openclaw-memory，但不要把 openclaw.json 弄坏”
