---
title: Upgrade Skill
description: Install the standalone Clawdhub upgrade skill that can safely repair, uninstall, reinstall, or upgrade the Bamdra OpenClaw memory suite.
---

# Upgrade Skill

`bamdra-memory-upgrade-operator` is a standalone operational skill for users who already have a local Bamdra suite install and need a safe repair path.

Use it when normal plugin install flows are blocked by:

- `plugin already exists`
- `plugin not found` errors caused by stale `openclaw.json`
- partial installs where `bamdra-openclaw-memory`, `bamdra-user-bind`, and `bamdra-memory-vector` are out of sync

## Install From Clawdhub

Install it directly into your OpenClaw skills directory:

```bash
clawdhub --workdir ~/.openclaw --dir skills install bamdra-memory-upgrade-operator --force
```

After install, the skill lives at:

```text
~/.openclaw/skills/bamdra-memory-upgrade-operator
```

## What It Does

The bundled script is backup-first.

Before it touches the suite, it can:

- back up `~/.openclaw/openclaw.json`
- remove stale Bamdra plugin references from config
- move old Bamdra plugin and skill folders into a backup directory
- reinstall the main package with `openclaw plugins install @bamdra/bamdra-openclaw-memory`
- restore the old config and directories if install fails

## Typical User Request

You can ask an agent to use the skill with a plain instruction such as:

```text
Use bamdra-memory-upgrade-operator to safely upgrade my Bamdra memory suite.
```

Or:

```text
Use bamdra-memory-upgrade-operator to safely uninstall the Bamdra memory suite without breaking openclaw.json.
```

## What The Script Supports

- `upgrade`
- `install`
- `uninstall`

If you need to run it manually:

```bash
node ~/.openclaw/skills/bamdra-memory-upgrade-operator/scripts/upgrade-bamdra-memory.cjs upgrade
```

## Why This Exists

OpenClaw's normal plugin install path is good for a clean first install, but older local states can still fail in awkward ways. This skill gives already-installed users a controlled repair path without hand-editing `openclaw.json` or manually deleting plugin folders.
