# bamdra-memory 接入指南

## 目标

在不破坏现有插件配置的前提下，把 `bamdra-memory` 接入已有 OpenClaw 实例。

## 插件目录

将以下目录加入 OpenClaw 的插件加载路径：

- `<仓库根目录>/bamdra-memory/plugins/bamdra-memory-context-engine`
- `<仓库根目录>/bamdra-memory/plugins/bamdra-memory-tools`

## 需要修改的 OpenClaw 配置

合并到 `~/.openclaw/openclaw.json` 中：

1. 设置 `plugins.enabled = true`
2. 将 `bamdra-memory-context-engine` 加入 `plugins.allow`
3. 如需工具，再将 `bamdra-memory-tools` 加入 `plugins.allow`
4. 把两个插件路径追加到 `plugins.load.paths`
5. 设置 `plugins.slots.contextEngine = "bamdra-memory-context-engine"`
6. 在 `plugins.entries` 下补充配置

如果你已经启用了其他插件，不要直接覆盖整个 `plugins` 对象。

## 本地内存缓存示例

使用：

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

它会提供：

- SQLite 持久化
- 进程内内存缓存
- context engine 激活

## Redis 缓存示例

使用：

- [openclaw.plugins.bamdra-memory.redis.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

它会提供：

- SQLite 作为真实数据源
- Redis 作为热缓存
- 同时启用工具插件

## 仅工具层覆盖示例

如果你只需要工具插件的配置片段：

- [openclaw.plugins.bamdra-memory-tools.json](../../examples/configs/openclaw.plugins.bamdra-memory-tools.json)

## 最小配置示例

```json
{
  "plugins": {
    "enabled": true,
    "allow": [
      "bamdra-memory-context-engine",
      "bamdra-memory-tools"
    ],
    "load": {
      "paths": [
        "<仓库根目录>/bamdra-memory/plugins/bamdra-memory-context-engine",
        "<仓库根目录>/bamdra-memory/plugins/bamdra-memory-tools"
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
      },
      "bamdra-memory-tools": {
        "enabled": true,
        "config": {}
      }
    }
  }
}
```

## 接入注意事项

- 即使开启 Redis，也应保持 SQLite 为真实数据源
- 开启 Redis 时必须设置独立 `keyPrefix`
- 修改配置后需要重启 OpenClaw
- 合并配置时要保留你现有的插件状态

## 当前接入边界

当前 bundle 已可以通过本地插件目录方式正常接入，但它面向运行时的 context engine 适配层，仍然是项目内的兼容封装。等 OpenClaw 上游 context-engine SDK 形态稳定后，应进一步对齐到正式接口。

## 下一步

接入完成后继续阅读：

- [使用指南](./usage.md)
