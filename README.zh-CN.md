# bamdra-memory

让单一 OpenClaw 会话拥有近乎无限的连续沟通能力：不轻易失忆，不怕话题切换，也不让 prompt 无限制膨胀。

面向 OpenClaw 的话题感知记忆、受控上下文装配与持久化事实召回方案。

`bamdra-memory` 让一个会话可以在多条 topic 之间自然切换，在被打断后安静地恢复正确上下文，并通过围绕活跃分支装配 prompt 来控制 token 成本，而不是把整段历史无限堆进去。

[English README](./README.md) | [English Docs](./docs/en/overview.md) | [中文文档目录](./docs/zh-CN/overview.md)

## 它实际带来的感觉

没有 `bamdra-memory` 时，长会话通常会出现这些问题：

- 本来在聊旅游，后来岔去聊吃什么，又被工作消息打断
- 处理完工作后，再回到旅游话题时，上下文已经散了
- 原本应该顺手接上的内容，结果又得重讲一遍

有了 `bamdra-memory` 之后，更像是在用一个带标签页的工作笔记本：

- 不同线程会在后台自动分开
- 重要事实可以主动钉住，而不是赌模型能一直记住
- 回到之前的话题时，衔接会自然很多，而不是重放整段聊天

## 一个简单效果示例

你和 OpenClaw 这样对话：

1. “下个月想在国内找个地方短途旅游。”
2. “如果去成都，先吃什么比较值？”
3. “我刚收到一个工作邮件，帮我写个礼貌回复，说我明天上午发方案过去。”
4. “继续说旅游。如果只有一个周末，成都和杭州选哪个更合适？”
5. “请记住，我订酒店更偏好离地铁站近一点。”

理想效果是：

- 旅游线索在处理完工作邮件后还能自然接上
- “吃什么”这条支线仍然和旅游主线保持关联
- 工作邮件不会污染后面的旅游建议
- 整个过程对用户来说是自然连续的，不需要系统解释内部动作
- 住酒店靠近地铁站这个偏好，后面可以直接用上

## 它是什么

`bamdra-memory` 是一套 OpenClaw 增强组件，把“记忆”从单纯的提示词约定，升级为结构化的运行时能力。

它带来的是：

- 面向话题的会话记忆
- 面向当前任务的短上下文
- 针对路径、约束、决策、引用信息的持久化召回
- 必要时可由 agent 主动调用的显式记忆工具

## 为什么会需要它

一般会在这些场景下安装它：

- 会话很长，而且经常被别的话题或任务打断
- 不想重复告诉模型同样的路径、规则和偏好
- 希望 assistant 能自然接回之前的话题
- 希望同一 agent、同一会话在重启后仍能恢复有效上下文

## 设计目标

- 控制提示词体积
- 在 topic 漂移后仍能保留关键事实
- 支持单 session 内的非线性对话
- 支持同一会话内的隐式 topic 恢复与显式 topic 控制
- 保持 agent 之间、用户之间的记忆隔离
- 默认适配轻量本地部署
- Redis 仅作为可选缓存，不作为事实源
- 让 OpenClaw 侧插件保持轻薄

## 隔离边界

`bamdra-memory` 的设计前提不是“全局共享记忆”，而是“在正确的会话边界里提供连续性”。

- 不同 agent 的记忆默认隔离
- 不同用户/会话的记忆默认隔离
- topic 切换发生在单个会话内部，不用于跨用户或跨 agent 共享隐私信息
- 显式保存的事实也必须服从运行时的会话与 agent 边界

对外发布时，应该把它理解成“同一会话连续性增强”，而不是“全局知识库”。

## 核心能力

- `隐式连续性恢复`
  在后台自动把不同话题分开，并在需要时恢复之前的线索。
- `上下文装配`
  从最近消息、摘要、open loops 和 pinned facts 中拼装当前 prompt 上下文。
- `持久化事实召回`
  以 category、sensitivity、scope、recall policy 等维度管理事实。
- `显式运维工具`
  支持 `memory_list_topics`、`memory_switch_topic`、`memory_save_fact`、`memory_compact_topic`、`memory_search`。
- `重启恢复`
  进程重启后可从 SQLite 恢复同一 agent / 同一会话的活跃状态。
- `可选 Redis 缓存`
  在多进程场景共享热状态，但不改变持久化模型。

## 使用前后区别

### 没有它时

- “我们刚聊过这个” 往往意味着重新翻聊天记录
- 重要事实需要反复强调
- topic 切换之后容易把旧内容带进当前 prompt

### 有了它之后

- 旧分支更容易找回
- 稳定事实可以只保存一次
- 当前上下文会围绕活跃分支重新装配

## 仓库结构

- `docs/`
  产品文档、架构说明、配置与接入文档。
- `packages/`
  存储、缓存、路由、装配、提取、摘要刷新等通用模块。
- `plugins/`
  面向 OpenClaw 的插件适配层。
- `examples/`
  可直接合并使用的配置覆盖示例。
- `schemas/`
  配置与工具契约的 JSON Schema。
- `skills/`
  面向 operator 的技能说明与可选的行为增强层。
- `tests/`
  覆盖路由、工具、搜索、上下文装配的集成测试。

## 安装

### 前置条件

- OpenClaw
- Node.js 22.x 或更新版本
- 可写入的 `~/.openclaw/` 目录

## 普通用户快速开始

普通用户更适合直接使用 GitHub Releases 里的已编译版本，而不是本地构建源码。

1. 下载最新 release 压缩包
2. 解压
3. 把下面两个目录拷贝到 `~/.openclaw/extensions/`：
   - `bamdra-memory-context-engine`
   - `bamdra-memory-tools`
4. 准备 SQLite 目录：

```bash
mkdir -p ~/.openclaw/extensions ~/.openclaw/memory
```

5. 把以下任一示例配置合并进 `~/.openclaw/openclaw.json`：
   - [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
   - [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
6. 重启 OpenClaw

OpenClaw 需要加载的插件路径是：

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

更完整的 release 安装说明见：

- [安装指南](./docs/zh-CN/installation.md)
- [提示词与最佳实践](./docs/zh-CN/prompting.md)

## 开发者从源码构建

如果你要从源码构建：

```bash
git clone git@github.com:bamdra/openclaw-topic-memory.git
cd openclaw-topic-memory
pnpm install
pnpm build
pnpm test
mkdir -p ~/.openclaw/memory
```

然后把构建后的插件目录：

- `./bamdra-memory/plugins/bamdra-memory-context-engine`
- `./bamdra-memory/plugins/bamdra-memory-tools`

复制到：

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

## 快速效果演示

如果安装正常，下面这种对话应该会显得比较自然：

1. “下个月想在中国找个地方过周末。”
2. “如果去成都，先吃什么比较值？”
3. “我刚收到一个工作邮件，帮我礼貌回复一下。”
4. “继续说旅游。如果只有一个周末，成都和杭州该选哪个？”
5. “请记住，我订酒店更偏好靠近地铁站。”
6. “那这趟行程住在哪一片会更方便？”

你应该感受到的是：

- 工作插曲之后，旅游线还能自然接上
- assistant 不会向用户汇报内部记忆机制
- 保存过的地铁站偏好能在后面直接被用上

## 为什么不只靠摘要？

- 只靠摘要，很容易在话题漂移后把重点覆盖掉
- 稳定事实不应该只靠某一段总结碰运气
- 长会话里，“连续性”和“事实召回”最好分开处理

## 常见问题

### 一定要用 Redis 吗？

不需要。对大多数用户来说，SQLite 加进程内缓存已经够用。

### 需要手动切换 topic 吗？

通常不需要。大部分上下文恢复都应该在后台无感完成，显式工具主要留给 operator 和特殊场景。

### 重启后还能接上吗？

可以，但这里说的是同一 agent、同一会话边界内的恢复。`bamdra-memory` 并不以跨用户、跨 agent 共享私有记忆为目标。

## 源码模式下的验证

如果你是从源码运行，可以用下面命令验证：

```bash
pnpm test
```

## 发布前验证

这次开源前的修复已经覆盖了下面这些关键点：

- `memory` slot 绑定到 `bamdra-memory-context-engine`
- 显式屏蔽内置 `memory-core`
- tools 插件在拿不到共享 runtime engine 时可按同一 SQLite 配置自举
- `memory_*` 与 `bamdra_*` 两套工具名都显式注册
- SQLite 写入和重启后恢复链路已实测通过

## 文档

### 英文文档

- [Product Overview](./docs/en/overview.md)
- [Installation Guide](./docs/en/installation.md)
- [Integration Guide](./docs/en/integration.md)
- [Usage Guide](./docs/en/usage.md)
- [Prompting Guide](./docs/en/prompting.md)

### 中文文档

- [产品概览](./docs/zh-CN/overview.md)
- [安装指南](./docs/zh-CN/installation.md)
- [接入指南](./docs/zh-CN/integration.md)
- [使用指南](./docs/zh-CN/usage.md)
- [提示词与文件写法](./docs/zh-CN/prompting.md)

### 技术参考

- [Architecture](./docs/architecture.md)
- [Data Model](./docs/data-model.md)
- [Configuration](./docs/configuration.md)
- [Runtime Integration Notes](./docs/openclaw-runtime-integration.md)
- [Memory Tools](./docs/bamdra-memory-tools.md)

## 当前状态

这套 bundle 已具备本地 OpenClaw 部署和联调使用条件，workspace 的构建和集成测试已经打通。

后续长期工作重点主要是：等待并对齐 OpenClaw 上游稳定后的 context-engine SDK 形态，再把当前运行时适配层替换成正式接口。
