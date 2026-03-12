# bamdra-memory

面向 OpenClaw 的话题感知记忆、上下文装配与持久化事实召回方案。

[English README](./README.md) | [English Docs](./docs/en/overview.md) | [中文文档目录](./docs/zh-CN/overview.md)

## 它实际带来的感觉

没有 `bamdra-memory` 时，长会话通常会出现这些问题：

- 聊着聊着 SQLite 和 Redis 两条线就混了
- 40 轮前说过的路径、约束、账号提示很容易消失
- 你说“回到刚才那个分支”，结果模型开始重放整段历史

有了 `bamdra-memory` 之后，更像是在用一个带标签页的工作笔记本：

- 不同线程会被拆成不同 topic
- 重要事实可以主动钉住，而不是赌模型能一直记住
- 切回旧分支时，恢复的是分支上下文，不是整段聊天回放

## 一个简单效果示例

你和 OpenClaw 这样对话：

1. “先设计 SQLite memory layout。”
2. “现在切到 Redis 作为可选缓存。”
3. “记住主库路径是 `/Users/mac/.openclaw/memory/main.sqlite`。”
4. “回到刚才 SQLite 那条线。”

理想效果是：

- SQLite 和 Redis 会分成两条 topic
- 主库路径之后还能被准确召回
- “回到刚才”会直接回到 SQLite 分支
- 当前 prompt 里保留的是 SQLite 相关上下文，而不是 Redis 干扰

## 它是什么

`bamdra-memory` 是一套 OpenClaw 增强组件，把“记忆”从单纯的提示词约定，升级为结构化的运行时能力。

它带来的是：

- 面向分支的会话记忆
- 面向当前任务的短上下文
- 针对路径、约束、决策、引用信息的持久化召回
- 必要时可由 agent 主动调用的显式记忆工具

## 为什么会需要它

一般会在这些场景下安装它：

- 会话很长，而且经常切 topic
- 不想重复告诉模型同样的路径、规则和偏好
- 希望“回到上一个分支”真的能工作
- 希望重启后状态还能恢复

## 设计目标

- 控制提示词体积
- 在 topic 漂移后仍能保留关键事实
- 支持单 session 内的非线性对话
- 默认适配轻量本地部署
- Redis 仅作为可选缓存，不作为事实源
- 让 OpenClaw 侧插件保持轻薄

## 核心能力

- `话题路由`
  自动判断继续当前分支、切回旧分支，还是生成新分支。
- `上下文装配`
  从最近消息、摘要、open loops 和 pinned facts 中拼装当前 prompt 上下文。
- `持久化事实召回`
  以 category、sensitivity、scope、recall policy 等维度管理事实。
- `显式运维工具`
  支持 `memory_list_topics`、`memory_switch_topic`、`memory_save_fact`、`memory_compact_topic`、`memory_search`。
- `重启恢复`
  进程重启后可从 SQLite 恢复活跃状态。
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
  面向 operator 的技能说明。
- `tests/`
  覆盖路由、工具、搜索、上下文装配的集成测试。

## 安装

### 前置条件

- Node.js 25.x 或更新版本
- pnpm 10.x
- 已启用本地插件加载的 OpenClaw
- 可通过 Node 内建 `node:sqlite` 使用 SQLite

### 安装依赖

```bash
pnpm install
```

### 构建

```bash
pnpm build
```

### 验证

```bash
pnpm test
```

## 真实安装方式

如果你想直接在本机 OpenClaw 里用这套插件，最直接的步骤是：

```bash
cd ~/workspace/openclaw-enhanced
pnpm install
pnpm build
mkdir -p ~/.openclaw/memory
```

然后编辑 `~/.openclaw/openclaw.json`，把下面这些配置片段合并进去：

- [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

OpenClaw 需要加载的插件目录是：

- `/Users/mac/workspace/openclaw-enhanced/bamdra-memory/plugins/bamdra-memory-context-engine`
- `/Users/mac/workspace/openclaw-enhanced/bamdra-memory/plugins/bamdra-memory-tools`

## 快速开始

1. 构建整个 workspace。
2. 选择一个示例配置合并到你的 OpenClaw 配置中。
3. 把插件目录加入 `plugins.load.paths`。
4. 设置 `plugins.slots.contextEngine = "bamdra-memory-context-engine"`。
5. 重启 OpenClaw。

示例配置：

- 本地 SQLite + 内存缓存：
  [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- SQLite + Redis 缓存：
  [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
- 仅工具插件：
  [openclaw.plugins.bamdra-memory-tools.json](./examples/configs/openclaw.plugins.bamdra-memory-tools.json)

## 文档

### English

- [Product Overview](./docs/en/overview.md)
- [Installation Guide](./docs/en/installation.md)
- [Integration Guide](./docs/en/integration.md)
- [Usage Guide](./docs/en/usage.md)
- [Prompting Guide](./docs/en/prompting.md)

### 中文

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
