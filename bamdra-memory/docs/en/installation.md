# bamdra-memory Installation Guide

## What You Get After Installing It

After installation, OpenClaw should feel different in a very practical way:

- you can move between several branches inside one session
- important paths, constraints, and preferences do not vanish after a dozen turns
- "go back to the earlier thread" becomes a realistic request
- restarts no longer wipe out the useful parts of memory

This is less about adding another technical component and more about making long sessions usable.

## Who Should Install It

Install it if any of these sound familiar:

- you run long OpenClaw sessions
- you often switch between several topics in one chat
- you are tired of repeating the same paths and constraints
- you want memory to survive restarts

## Requirements

- Node.js 25.x or newer
- pnpm 10.x
- a writable local directory for SQLite
- a working OpenClaw installation

Optional:

- Redis, if you really need shared hot cache state

## Step 1: Install Dependencies

```bash
cd ~/workspace/openclaw-enhanced
pnpm install
```

## Step 2: Build the Plugins

```bash
pnpm build
```

If you want to verify the workspace first:

```bash
pnpm test
```

## Step 3: Prepare the SQLite Directory

```bash
mkdir -p ~/.openclaw/memory
```

Recommended SQLite path:

```text
/Users/mac/.openclaw/memory/main.sqlite
```

## Step 4: Point OpenClaw at the Plugin Directories

OpenClaw should load these directories directly:

- `/Users/mac/workspace/openclaw-enhanced/bamdra-memory/plugins/bamdra-memory-context-engine`
- `/Users/mac/workspace/openclaw-enhanced/bamdra-memory/plugins/bamdra-memory-tools`

So the installation model is simple: build the repo, then let OpenClaw load the plugin roots from the filesystem.

## Step 5: Edit `~/.openclaw/openclaw.json`

Open:

```text
~/.openclaw/openclaw.json
```

Merge in the plugin settings. Do not replace the whole `plugins` object if you already use other plugins.

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
        "/Users/mac/workspace/openclaw-enhanced/bamdra-memory/plugins/bamdra-memory-context-engine"
      ]
    },
    "slots": {
      "contextEngine": "bamdra-memory-context-engine"
    },
    "entries": {
      "bamdra-memory-context-engine": {
        "enabled": true,
        "config": {
          "enabled": true,
          "store": {
            "provider": "sqlite",
            "path": "/Users/mac/.openclaw/memory/main.sqlite"
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

## Step 6: Restart OpenClaw

Restart OpenClaw after saving the config.

## How To Check Whether It Works

Try this real conversation:

1. "Let's work on the SQLite memory design."
2. "Now switch to Redis as an optional cache."
3. "Remember that the main DB path is `/Users/mac/.openclaw/memory/main.sqlite`."
4. "Go back to the SQLite branch."

If the installation is working, you should see this effect:

- SQLite and Redis become separate branches
- the DB path stays recallable later
- going back does not drag the Redis detour into the active context

## Recommended Next Step

After installation, read:

- [Prompting Guide](./prompting.md)

Connecting the plugin is only half the job. The user experience also depends on whether your agent knows when to save memory, search memory, and switch topics.
