# bamdra-openclaw-memory Installation Guide

## What You Get After Installing It

After installation, OpenClaw should feel different in a very practical way:

- you can pause one thread, handle another, and come back without losing the original flow
- important paths, constraints, and preferences do not vanish after a dozen turns
- work interruptions do not ruin the earlier conversation
- restarts no longer wipe out the useful parts of memory

This is less about adding another technical component and more about making long sessions usable.

## Who Should Install It

Install it if any of these sound familiar:

- you run long OpenClaw sessions
- you often get interrupted by unrelated tasks during one chat
- you are tired of repeating the same paths and constraints
- you want memory to survive restarts

## Requirements

- Node.js 22.12.0 or newer
- pnpm 10.x
- a writable local directory for SQLite
- a working OpenClaw installation

## Supported Install Paths

`bamdra-openclaw-memory` supports two public install paths:

1. npm / OpenClaw CLI install
2. manual install from the packaged release zip

If npm-based plugin install works in your OpenClaw environment, prefer that. If you want a manual or offline path, use the release package.

## Install With npm Or OpenClaw CLI

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

OpenClaw should then see `bamdra-openclaw-memory` as the active `memory` and `contextEngine` slot target.

When `bamdra-openclaw-memory` is installed through npm, its package `postinstall` bootstrap now patches `~/.openclaw/openclaw.json` immediately, auto-creates the local memory directory, auto-provisions `bamdra-user-bind`, auto-provisions and enables `bamdra-memory-vector`, materializes the bundled skills into `~/.openclaw/skills/`, and disables conflicting built-in memory plugins such as `memory-core` and `memory-lancedb`.

Important OpenClaw CLI note:

- `openclaw plugins install @bamdra/bamdra-openclaw-memory` is the supported one-command install path for this suite
- `openclaw update` updates OpenClaw itself for source installs; it should not be treated as a plugin migration hook
- the runtime still keeps an idempotent bootstrap fallback, but npm install no longer depends on first plugin activation to finish the setup

After install, the recommended prompt split is:

- let `bamdra-user-bind` own per-user profile data such as preferred address, nickname, timezone, and stable tone defaults
- keep workspace `USER.md` files minimal and focused on environment facts rather than identity

Recommended vector best practice after install:

```json
{
  "plugins": {
    "entries": {
      "bamdra-memory-vector": {
        "enabled": true,
        "config": {
          "enabled": true,
          "privateMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/private",
          "sharedMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/shared",
          "indexPath": "~/.openclaw/memory/vector/index.json",
          "dimensions": 64
        }
      }
    }
  }
}
```

That lets teams keep the index local while editing the Markdown knowledge base in Obsidian or another synced workspace.

## Install From Release

### Step 1: Download and Unzip

```bash
mkdir -p ~/Downloads/bamdra-openclaw-memory
cd ~/Downloads/bamdra-openclaw-memory
unzip bamdra-openclaw-memory-release.zip
```

After unzip, you should have a folder that contains at least:

- `bamdra-openclaw-memory/`
- `bamdra-user-bind/`
- `bamdra-memory-vector/`
- `bamdra-openclaw-memory/skills/bamdra-memory-operator/SKILL.md`
- `examples/configs/`
- `INSTALL.md`
- `README.md`
- `README.zh-CN.md`

### Step 2: Copy the Plugins Into OpenClaw

```bash
mkdir -p ~/.openclaw/extensions
cp -R ./bamdra-openclaw-memory ~/.openclaw/extensions/
```

Optional standalone companions:

```bash
cp -R ./bamdra-user-bind ~/.openclaw/extensions/
cp -R ./bamdra-memory-vector ~/.openclaw/extensions/
```

### Step 3: Use This SQLite Path

```text
~/.openclaw/memory/main.sqlite
```

### Step 4: Merge Config Into `~/.openclaw/openclaw.json`

OpenClaw should load these directories directly:

- `~/.openclaw/extensions/bamdra-openclaw-memory`

```text
~/.openclaw/openclaw.json
```

Merge in the plugin settings from the release bundle. Do not replace the whole `plugins` object if you already use other plugins.

The release bundle and npm package also ship the bundled skills under `skills/`.
Current bootstrap logic materializes them into `~/.openclaw/skills/` and attaches them automatically:

- `bamdra-memory-operator` for all agents
- `bamdra-user-bind-profile` for all agents
- `bamdra-user-bind-admin` for the default admin agent, which is `main` unless configured otherwise
- `bamdra-memory-vector-operator` for all agents when the vector plugin is present

### Most Common Setup: SQLite + Local Memory Cache

Reference:

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- [openclaw.plugins.bamdra-memory.suite.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.suite.merge.json)

The core shape looks like this:

```json
{
  "plugins": {
    "enabled": true,
    "allow": [
      "bamdra-openclaw-memory"
    ],
    "deny": [
      "memory-core",
      "memory-lancedb"
    ],
    "load": {
      "paths": [
        "~/.openclaw/extensions/bamdra-openclaw-memory"
      ]
    },
    "slots": {
      "memory": "bamdra-openclaw-memory",
      "contextEngine": "bamdra-openclaw-memory"
    },
    "entries": {
      "bamdra-openclaw-memory": {
        "enabled": true,
        "config": {
          "enabled": true,
          "store": {
            "provider": "sqlite",
            "path": "~/.openclaw/memory/main.sqlite"
          },
          "cache": {
            "provider": "memory",
            "maxSessions": 128
          }
        }
      }
    }
  }
}
```

### Step 5: Restart OpenClaw

Restart OpenClaw after saving the config.

## How To Check Whether It Works

Try this real conversation:

1. "Let's plan a short trip in China next month."
2. "If we go to Chengdu, what food should we prioritize?"
3. "I just got a work email. Help me write a polite reply saying I can send the proposal tomorrow morning."
4. "Back to the trip. If we only have one weekend, should we pick Chengdu or Hangzhou?"
5. "Please remember that I prefer hotels near a subway station."
6. "For that trip, which area is easier if I care about subway access?"

If the installation is working, you should see this effect:

- the travel conversation still feels coherent after the email interruption
- the food discussion still feels connected to the travel planning
- the email detour does not pollute the later travel answer
- the saved hotel preference can be reused later

## Developer Build From Source

Use this only if you want to modify the code:

```bash
git clone git@github.com:bamdra/bamdra-openclaw-memory.git
cd bamdra-openclaw-memory
pnpm install
pnpm build
pnpm test
```

Then copy:

- `./plugins/bamdra-memory`

into:

- `~/.openclaw/extensions/bamdra-openclaw-memory`

## Recommended Next Step

After installation, read:

- [Prompting Guide](./prompting.md)

Connecting the plugin is only half the job. The user experience also depends on whether your agent knows when to save memory, search memory, and recover earlier context naturally.
