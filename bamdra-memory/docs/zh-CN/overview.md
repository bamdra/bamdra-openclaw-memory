# bamdra-memory 产品概览

## 简介

`bamdra-memory` 是一套面向 OpenClaw 的话题感知记忆系统，用来帮助智能体在一个 session 内管理多个工作分支，避免在长会话中丢失上下文、忘记长期事实，或反复重放历史消息。

## 面向谁

- 使用 OpenClaw 进行长时会话的个人用户或 operator
- 需要结构化记忆，而不是只依赖 prompt 备注的开发者
- 希望默认采用 SQLite、本地优先部署的用户
- 在多进程场景下需要共享热状态缓存的部署者

## 核心问题

一个长 session 往往同时夹杂多个线程：

- 架构讨论
- 代码实现
- 运维说明
- 环境约束
- 账号与安全提醒

如果记忆只存在于最近消息或自由文本摘要里，智能体会：

- 混淆不同分支
- 忘记关键事实
- 浪费 token 去找回旧上下文

## bamdra-memory 的改变

`bamdra-memory` 把记忆当作结构化系统来处理：

- 一个 session 可以包含多个 topic
- 当前只维护一个活跃 topic
- 事实不会被埋在摘要里，而是独立存储
- prompt 只装配当前 topic 所需上下文
- 进程重启后仍可恢复状态

## 核心特性

- `话题路由`
  判断新消息应该继续当前 topic、切回旧 topic，还是新建 topic。
- `紧凑上下文装配`
  基于 topic 摘要、open loops、最近消息和 pinned facts 生成 prompt。
- `持久化事实模型`
  使用 category、sensitivity、scope、confidence、recall policy 管理事实。
- `SQLite 持久化`
  用 SQLite 保存消息、topic、facts 和 session state。
- `可选 Redis 缓存`
  在需要多进程共享热状态时启用 Redis。
- `显式记忆工具`
  让智能体可以主动读取和控制记忆。

## 能力地图

### 会话分支管理

- 把不同任务拆成不同 topic
- 无需重放全量历史即可回到旧分支
- 在多轮对话中保持活跃分支身份

### 记忆召回

- 保存 session 级常驻事实
- 保存 topic 级绑定事实
- 仅保存 secret reference，而不直接注入 secret 原文

### Prompt 效率

- 不注入完整 session 历史
- 只关注当前活跃 topic
- 通过配置限制 prompt 体积

### 运维简洁性

- 本地优先
- 单机默认不依赖 Redis
- 存储模型可预测、可检查

## 设计目标

- 控制 prompt 大小
- 保证跨 topic 的关键事实召回
- 支持 session 内的分支式对话
- 支持重启恢复
- 默认适配本地轻量部署
- 让插件适配层保持薄而清晰

## 非目标

- v1 不做完整分布式记忆基础设施
- 不做全历史语义搜索
- 不试图替代 OpenClaw 的所有记忆能力
- 不把 Redis 作为真实数据源

## 主要组件

- `memory-core`
  共享契约与领域模型
- `memory-sqlite`
  SQLite 持久化存储
- `memory-cache-memory`
  默认内存缓存
- `memory-cache-redis`
  可选 Redis 缓存
- `topic-router`
  topic 路由逻辑
- `context-assembler`
  prompt 上下文构建器
- `fact-extractor`
  轻量事实提取器
- `summary-refresher`
  topic 摘要刷新器
- `bamdra-memory-context-engine`
  面向运行时的 context engine 适配层
- `bamdra-memory-tools`
  显式工具层

## 建议阅读顺序

- [安装指南](./installation.md)
- [接入指南](./integration.md)
- [使用指南](./usage.md)
- [架构参考](../architecture.md)
