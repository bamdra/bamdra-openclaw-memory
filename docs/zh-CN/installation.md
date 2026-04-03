# bamdra-openclaw-memory 安装指南

## 你最终会得到什么

安装完成后，OpenClaw 的实际体验会变成这样：

- 你可以先聊一件事，中途处理另一件事，再自然接回原话题
- 说过一次的重要路径、约束、偏好，不需要反复重复
- 工作打断不会把前面的思路冲散
- 重启后，记忆不会因为窗口清空就消失

这不是“多一个技术组件”，而是让长会话终于有连续性。

## 最适合谁装

如果你符合下面任意一条，就值得装：

- 你经常和 OpenClaw 长时间协作
- 你经常在一次对话里被别的事情打断
- 你讨厌反复告诉模型相同路径、约束和背景
- 你希望 agent 能记住一些长期有效的信息

## 安装前准备

你需要：

- Node.js 22.12.0 或更高
- pnpm 10.x
- 一个本地可写目录给 SQLite
- 已经能正常运行的 OpenClaw

## 支持的安装方式

`bamdra-openclaw-memory` 现在支持两种公开安装路径：

1. npm / OpenClaw CLI 安装
2. release 压缩包手动安装

如果你的 OpenClaw 环境支持 npm 插件安装，优先推荐这条路径；如果你更偏好手动安装或离线分发，就使用 release 包。

## 通过 npm 或 OpenClaw CLI 安装

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

随后 OpenClaw 应该会把 `bamdra-openclaw-memory` 视为当前的 `memory` 和 `contextEngine` 槽位目标。

通过 npm 安装 `bamdra-openclaw-memory` 时，包里的 `postinstall` bootstrap 现在会立刻补齐 `~/.openclaw/openclaw.json`，然后自动创建本地 memory 目录、自动把 `bamdra-user-bind` 补齐到 OpenClaw 扩展目录、自动补齐并启用 `bamdra-memory-vector`、把随包 skill 物化到 `~/.openclaw/skills/`，同时禁用冲突的内置 memory 插件，例如 `memory-core` 和 `memory-lancedb`。

关于 OpenClaw CLI 还要注意：

- `openclaw plugins install @bamdra/bamdra-openclaw-memory` 才是这套插件支持的一条命令安装路径
- `openclaw update` 主要更新的是 OpenClaw 本体，尤其是源码安装场景，不应把它当成插件迁移钩子
- runtime 里仍然保留幂等 bootstrap 兜底，但 npm 安装流程现在不再依赖首次激活插件才能完成补齐

## 已有安装如何升级

日常升级插件时，直接重复执行同一条安装命令：

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

如果你想固定到某个指定版本，就把版本号写清楚：

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory@0.3.25
```

`openclaw update` 只在你要升级 OpenClaw 本体时使用。
如果本地安装已经出现残留目录、半安装状态或配置污染，先打开 `~/.openclaw/skills/` 里的 `bamdra-memory-upgrade-operator`，按里面的备份优先修复清单处理，再重新执行安装命令。

安装完成后，推荐的 prompt 分工是：

- 让 `bamdra-user-bind` 负责默认称呼、昵称、时区、长期语气偏好等 per-user 画像信息
- 让 workspace 里的 `USER.md` 保持轻量，只保留环境事实，不再重复身份层内容

安装后的向量最佳实践建议：

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

这种方式会把索引继续留在本地，同时允许你把 Markdown 知识库挂到 Obsidian 或其他同步工作区。

## 直接使用 Release 安装

### 第 1 步：下载并解压

```bash
mkdir -p ~/Downloads/bamdra-openclaw-memory
cd ~/Downloads/bamdra-openclaw-memory
unzip bamdra-openclaw-memory-release.zip
```

解压后，你应该能看到至少这些内容：

- `bamdra-openclaw-memory/`
- `bamdra-user-bind/`
- `bamdra-memory-vector/`
- `bamdra-openclaw-memory/skills/bamdra-memory-operator/SKILL.md`
- `examples/configs/`
- `INSTALL.md`
- `README.md`
- `README.zh-CN.md`

### 第 2 步：把插件复制到 OpenClaw 目录

```bash
mkdir -p ~/.openclaw/extensions
cp -R ./bamdra-openclaw-memory ~/.openclaw/extensions/
```

如果你要独立使用配套插件，也可以额外复制：

```bash
cp -R ./bamdra-user-bind ~/.openclaw/extensions/
cp -R ./bamdra-memory-vector ~/.openclaw/extensions/
```

### 第 3 步：SQLite 建议路径

```text
~/.openclaw/memory/main.sqlite
```

### 第 4 步：把配置合并到 `~/.openclaw/openclaw.json`

OpenClaw 需要加载这个目录：

- `~/.openclaw/extensions/bamdra-openclaw-memory`

```text
~/.openclaw/openclaw.json
```

把 release 里的配置片段合并进去，不要粗暴覆盖整个 `plugins` 对象。

### 最常用安装方式：SQLite + 本地内存缓存

你可以参考：

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- [openclaw.plugins.bamdra-memory.suite.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.suite.merge.json)

核心结构是：

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

显式记忆工具已经内置在 `bamdra-memory` 这个统一插件里，不需要再额外安装 tools 插件。

release 压缩包和 npm 包也会一并携带 `skills/` 目录下的行为层 skill。
当前 bootstrap 会自动把它们复制到 `~/.openclaw/skills/` 并挂到 agent 上：

- `bamdra-memory-operator`：默认挂到所有 agent
- `bamdra-user-bind-profile`：默认挂到所有 agent
- `bamdra-user-bind-admin`：默认挂到管理员 agent，默认是 `main`
- `bamdra-memory-vector-operator`：当向量插件存在时默认挂到所有 agent

### 第 5 步：重启 OpenClaw

配置改完后，重启 OpenClaw。

## 怎么判断安装成功

你可以用下面这种真实对话测试：

1. “下个月想在国内找个地方短途旅游。”
2. “如果去成都，先吃什么比较值？”
3. “我刚收到一个工作邮件，帮我写个礼貌回复，说我明天上午发方案过去。”
4. “继续说旅游。如果只有一个周末，成都和杭州选哪个更合适？”
5. “请记住，我订酒店更偏好离地铁站近一点。”
6. “那这趟行程住在哪一片会更方便？”

如果安装正常，实际效果应该是：

- 旅游线索在处理完工作邮件后还能自然接上
- “吃什么”这条支线仍然和旅游主线保持关联
- 工作邮件不会污染后面的旅游建议
- 保存过的酒店偏好可以在后面直接被用上

## 开发者从源码构建

只有在你需要改代码时才建议走这条路：

```bash
git clone git@github.com:bamdra/bamdra-openclaw-memory.git
cd bamdra-openclaw-memory
pnpm install
pnpm build
pnpm test
```

然后把：

- `./plugins/bamdra-memory`

复制到：

- `~/.openclaw/extensions/bamdra-openclaw-memory`

## 推荐继续做的一步

安装完成之后，最好再补这份文档：

- [提示词与文件写法](./prompting.md)

因为插件接上只是第一步。真正决定体验的是：agent 知不知道什么时候该保存、搜索，以及安静地接回较早的上下文。
