# Memory V2 Configuration

## Goals

- default to lightweight local deployment
- make Redis explicitly opt-in
- keep persistence independent from cache backend

## Proposed Config Shape

```json
{
  "memoryV2": {
    "enabled": true,
    "store": {
      "provider": "sqlite",
      "path": "/Users/mac/.openclaw/memory/main.sqlite"
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
      "contextEngine": {
        "package": "@openclaw-enhanced/bamdra-memory-context-engine",
        "config": {
          "enabled": true,
          "store": {
            "provider": "sqlite",
            "path": "/Users/mac/.openclaw/memory/main.sqlite"
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

## Redis-Enabled Variant

```json
{
  "memoryV2": {
    "enabled": true,
    "store": {
      "provider": "sqlite",
      "path": "/Users/mac/.openclaw/memory/main.sqlite"
    },
    "cache": {
      "provider": "redis",
      "url": "redis://127.0.0.1:6379/0",
      "keyPrefix": "openclaw:memory-v2:",
      "ttlSeconds": 21600,
      "fallbackToMemory": true
    }
  }
}
```

## Behavior Rules

- `store.provider` is always required.
- `cache.provider=memory` is the default.
- `cache.provider=redis` requires explicit server configuration.
- Redis is cache only, never source of truth.
- If Redis fails and `fallbackToMemory=true`, the system should degrade gracefully.
- Redis keys should always live under a dedicated `keyPrefix` to avoid collisions with other services.
