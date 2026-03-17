---
title: 套件总览
description: 看清 Bamdra 三个公开插件分别负责什么、为什么要拆开，以及组合起来到底能带来什么效果。
---

# 套件总览

## 一键安装整套能力

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

这一条命令，是把整套能力装进 OpenClaw 的最快方式。

## 三个公开插件分别是什么

三个插件都可以独立运行，但组合起来才能形成一套完整的记忆与知识系统。

### `bamdra-openclaw-memory`

这是 continuity-first 的主运行时。

它负责：

- 话题路由
- 长会话连续性
- 持久化事实存储
- 紧凑上下文装配
- 中断与重启后的恢复

它的任务，是让对话始终停留在正确的工作分支上，而不是让 prompt 不断膨胀。

### `bamdra-user-bind`

这是身份与用户画像层。

它负责：

- 把渠道里的原始 sender ID 转成稳定用户边界
- 安全保存用户画像
- 把画像镜像到可编辑 Markdown
- 区分普通用户权限和管理员权限
- 为整个记忆系统提供个性化基础

它让智能体不只是“记得一段会话”，而是真的逐步“认识这个用户”。

### `bamdra-memory-vector`

这是本地知识库与语义召回层。

它负责：

- 索引本地 Markdown 知识库
- 区分私有知识和共享知识
- 为模糊提问提供语义召回
- 保持知识可读、可改、可维护

这正好补齐了 continuity-first 记忆系统最后一块短板：真正可维护的知识库。

## 为什么要拆成三个插件

这不是为了复杂化，而是为了让边界更清楚。

- 不同团队可以只采用自己需要的那一层
- 身份层可以脱离主记忆插件独立复用
- 知识库层也可以单独作为本地检索插件使用
- 安全边界更清晰
- 版本、发布和后续演进更容易管理

## 为什么组合起来最强

真正的产品价值，出现在三者一起工作的时候：

- `bamdra-user-bind` 知道“这个人是谁”
- `bamdra-openclaw-memory` 知道“现在在做哪条工作分支”
- `bamdra-memory-vector` 知道“本地哪份文档、笔记或知识条目最相关”

于是智能体可以：

- 用正确的方式称呼用户
- 自然接回正确的话题
- 复用长期偏好、决策和工作背景
- 在上网之前优先查本地知识库
- 随着画像、记忆、知识不断积累而逐步进化

## 架构图

完整架构和面向普通用户的理解图在这里：

- [架构图](/zh/guide/architecture)

## 应该先装哪一个

优先装 `bamdra-openclaw-memory`。

原因很简单：

- 它是主运行时入口
- 能最快带来连续性提升
- 会自动补齐身份层
- 会一并准备好知识库层

## 最理想的采用顺序

### 第 1 步：连续性

先安装 `bamdra-openclaw-memory`，让中断和切题不再轻易破坏长会话。

### 第 2 步：个性化

让 `bamdra-user-bind` 建立稳定用户画像和可编辑 Markdown 镜像。

### 第 3 步：知识库

把 `bamdra-memory-vector` 指向私有与共享 Markdown 根目录，让本地文档、笔记、SOP、changelog 和 ideas 都能进入检索链路。

## 仓库地址

- [GitHub 首页](https://github.com/bamdra)
- [bamdra-openclaw-memory](https://github.com/bamdra/bamdra-openclaw-memory)
- [bamdra-user-bind](https://github.com/bamdra/bamdra-user-bind)
- [bamdra-memory-vector](https://github.com/bamdra/bamdra-memory-vector)
