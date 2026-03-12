# bamdra-memory

面向 OpenClaw 的话题感知记忆、上下文装配与持久化事实召回方案。

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

1. “下个月去哪边旅游比较好？”
2. “如果去大阪，有哪些一定要吃的东西？”
3. “我刚收到一个工作邮件，帮我写个礼貌回复，说我明天上午发文件过去。”
4. “继续说旅游。如果只有一个短周末，大阪和京都哪个更适合吃东西？”

理想效果是：

- 旅游线索在处理完工作邮件后还能自然接上
- “吃什么”这条支线仍然和旅游主线保持关联
- 工作邮件不会污染后面的旅游建议
- 整个过程对用户来说是自然连续的，不需要系统解释内部动作

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
  在后台自动把不同话题分开，并在需要时恢复之前的线索。
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

- Node.js 22.x 或更新版本
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

## 推荐安装方式

对普通用户来说，推荐方式是：

1. 下载已经编译好的 release 版本
2. 把插件目录放到 `~/.openclaw/extensions/`
3. 在 `~/.openclaw/openclaw.json` 里启用它们

本地编译更适合开发者。

## 开发者从源码构建

如果你想从源码构建：

```bash
git clone <你的 fork 或 release 源码地址>
cd openclaw-topic-memory
pnpm install
pnpm build
mkdir -p ~/.openclaw/memory
```

然后编辑 `~/.openclaw/openclaw.json`，把下面这些配置片段合并进去：

- [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)

OpenClaw 需要加载的插件目录是：

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

## 快速开始

1. 下载编译好的 release，或从源码构建。
2. 把插件目录放到 `~/.openclaw/extensions/`。
3. 选择一个示例配置合并到你的 OpenClaw 配置中。
4. 把这些目录加入 `plugins.load.paths`。
5. 设置 `plugins.slots.contextEngine = "bamdra-memory-context-engine"`。
6. 重启 OpenClaw。

示例配置：

- 本地 SQLite + 内存缓存：
  [openclaw.plugins.bamdra-memory.local.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)
- SQLite + Redis 缓存：
  [openclaw.plugins.bamdra-memory.redis.merge.json](./examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
- 仅工具插件：
  [openclaw.plugins.bamdra-memory-tools.json](./examples/configs/openclaw.plugins.bamdra-memory-tools.json)

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
