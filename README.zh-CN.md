# bamdra-openclaw-memory

面向 OpenClaw 的 continuity-first 主记忆运行时。

一键安装：

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

这一条命令现在会把整套 Bamdra 记忆栈一起准备好：

- `bamdra-openclaw-memory`
- `bamdra-user-bind`
- `bamdra-memory-vector`

[English README](./README.md)

## 它是什么

`bamdra-openclaw-memory` 是 Bamdra 套件中的主运行时插件。

它让 OpenClaw 能够：

- 保持正确的话题分支
- 保存长期事实
- 生成紧凑上下文
- 在中断和重启后继续恢复
- 和真实身份层、真实本地知识库层协同工作

## 为什么团队会装它

没有 continuity 运行时的时候，长会话很快就会散：

- 用户不断重复背景
- 中断会破坏连续性
- 稳定决策沉没进聊天记录
- 本地文档和笔记无法进入召回链路

有了这套系统后，智能体会随着用户一起进化，因为画像、记忆和知识都变成了可持续积累的资产。

## 为什么说这套体系已经完整

### `bamdra-user-bind`

负责稳定用户边界和“活的画像层”。

它会承担大部分 per-user `USER.md` 想做的事情：

- 应该怎么称呼
- 时区
- 语气偏好
- 角色与协作方式
- 长期用户备注

### `bamdra-memory-vector`

负责把本地 Markdown 变成真正的知识库。

它会索引：

- `knowledge/`
- `docs/`
- `notes/`
- `ideas/`

并尽量让本地知识召回优先于不必要的 web search。

## 架构图

```mermaid
flowchart LR
  user["用户"] --> bind["bamdra-user-bind"]
  bind --> memory["bamdra-openclaw-memory"]
  memory --> vector["bamdra-memory-vector"]
  bind --> profile["Profile SQLite + Markdown 镜像"]
  memory --> main["主 SQLite 记忆库"]
  vector --> kb["私有 / 共享 Markdown 知识库"]
  memory --> prompt["紧凑上下文"]
  prompt --> agent["OpenClaw agent"]
```

## 最佳实践

推荐这样使用：

- 让 `bamdra-openclaw-memory` 占据 `memory` 和 `contextEngine` 槽位
- 让 `bamdra-user-bind` 负责身份与个性化
- 让 `bamdra-memory-vector` 负责本地 Markdown 知识与语义召回

推荐的向量根目录：

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
          "indexPath": "~/.openclaw/memory/vector/index.json"
        }
      }
    }
  }
}
```

这样你会同时得到：

- 本地优先的连续性运行时
- 可持续维护的用户画像
- 真正可编辑的私有与共享知识库

## 继续阅读

- [安装指南](./docs/zh-CN/installation.md)
- [提示词指南](./docs/zh-CN/prompting.md)
- [配置样例](./examples/configs/openclaw.plugins.bamdra-memory.suite.merge.json)
- [GitHub 首页](https://github.com/bamdra)
