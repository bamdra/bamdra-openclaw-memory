# Memory V2 Configuration

## Goals

- default to lightweight local deployment
- keep persistence independent from cache backend

## Proposed Config Shape

```json
{
  "memoryV2": {
    "enabled": true,
    "store": {
      "provider": "sqlite",
      "path": "~/.openclaw/memory/main.sqlite"
    },
    "cache": {
      "provider": "memory",
      "maxSessions": 128,
      "maxTopicsPerSession": 64,
      "maxFacts": 2048
    },
    "topicRouting": {
      "maxRecentTopics": 12,
      "newTopicThreshold": 0.42,
      "switchTopicThreshold": 0.68
    },
    "contextAssembly": {
      "recentTurns": 6,
      "includeTopicShortSummary": true,
      "includeOpenLoops": true,
      "alwaysFactLimit": 12,
      "topicFactLimit": 16
    }
  }
}
```

## OpenClaw Plugin Slot Example

```json
{
  "plugins": {
    "allow": [
      "memory-v2"
    ],
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
            "maxSessions": 128,
            "maxTopicsPerSession": 64,
            "maxFacts": 2048
          }
        }
      }
    }
  }
}
```

## Behavior Rules

- `store.provider` is always required.
- `cache.provider=memory` is the default.
