# bamdra-memory Installation Guide

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

- Node.js 22.x or newer
- pnpm 10.x
- a writable local directory for SQLite
- a working OpenClaw installation

Optional:

- Redis, if you really need shared hot cache state

## Recommended Install Model

For normal users, the recommended path is:

1. download a compiled release package
2. place the plugin folders under `~/.openclaw/extensions/`
3. enable them in `~/.openclaw/openclaw.json`

Local building from source is mainly for developers.

## Install From Release

### Step 1: Download and Unzip

```bash
mkdir -p ~/Downloads/openclaw-topic-memory
cd ~/Downloads/openclaw-topic-memory
unzip openclaw-topic-memory-release.zip
```

After unzip, you should have a folder that contains at least:

- `bamdra-memory-context-engine/`
- `bamdra-memory-tools/`
- `examples/configs/`
- `INSTALL.md`

### Step 2: Copy the Plugins Into OpenClaw

```bash
mkdir -p ~/.openclaw/extensions ~/.openclaw/memory
cp -R ./bamdra-memory-context-engine ~/.openclaw/extensions/
cp -R ./bamdra-memory-tools ~/.openclaw/extensions/
```

### Step 3: Use This SQLite Path

```text
~/.openclaw/memory/main.sqlite
```

### Step 4: Merge Config Into `~/.openclaw/openclaw.json`

OpenClaw should load these directories directly:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

```text
~/.openclaw/openclaw.json
```

Merge in the plugin settings from the release bundle. Do not replace the whole `plugins` object if you already use other plugins.

### Most Common Setup: SQLite + Local Memory Cache

Reference:

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

The core shape looks like this:

```json
{
  "plugins": {
    "enabled": true,
    "allow": [
      "bamdra-memory-context-engine"
    ],
    "load": {
      "paths": [
        "~/.openclaw/extensions/bamdra-memory-context-engine"
      ]
    },
    "slots": {
      "memory": "bamdra-memory-context-engine"
    },
    "entries": {
      "bamdra-memory-context-engine": {
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

### If You Also Want Explicit Memory Tools

Add the tool plugin too:

- [openclaw.plugins.bamdra-memory.redis.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
- [openclaw.plugins.bamdra-memory-tools.json](../../examples/configs/openclaw.plugins.bamdra-memory-tools.json)

The important parts are:

- add `bamdra-memory-tools` to `plugins.allow`
- add the tools plugin directory to `plugins.load.paths`
- add a `plugins.entries.bamdra-memory-tools` entry

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
git clone git@github.com:bamdra/openclaw-topic-memory.git
cd openclaw-topic-memory
pnpm install
pnpm build
pnpm test
```

Then copy:

- `./bamdra-memory/plugins/bamdra-memory-context-engine`
- `./bamdra-memory/plugins/bamdra-memory-tools`

into:

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

## Recommended Next Step

After installation, read:

- [Prompting Guide](./prompting.md)

Connecting the plugin is only half the job. The user experience also depends on whether your agent knows when to save memory, search memory, and recover earlier context naturally.
