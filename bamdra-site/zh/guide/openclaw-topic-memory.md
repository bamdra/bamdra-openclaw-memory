---
title: bamdra-openclaw-memory
description: Bamdra 面向 OpenClaw 的主记忆运行时，负责连续性、事实存储与上下文调度。
---

# bamdra-openclaw-memory

## 一键安装

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

## 它是什么

`bamdra-openclaw-memory` 是这套系统里的主运行时。

它负责让 OpenClaw 在长会话、中断、切题和重启之后，仍然维持正确连续性。

## 核心价值

它不只是“存一点记忆”。

它真正负责判断：

- 当前应该延续哪条分支
- 应该召回什么
- 哪些内容应该变成长期事实
- 哪些内容不应该继续污染 prompt

这也是它为什么是 continuity-first 运行时，而不是一个简单的记忆日志。

## 核心能力

- 话题分支管理
- 带作用域的长期事实存储
- 紧凑上下文装配
- 重启恢复
- 面向 operator 的记忆工具
- 通过 `bamdra-user-bind` 接入用户边界和个性化
- 通过 `bamdra-memory-vector` 接入本地知识库与语义召回

## 为什么重要

没有这一层时：

- 用户需要重复背景
- 中断会破坏连续性
- 稳定决策很快沉没进聊天记录

有了它之后：

- 正确分支能被恢复
- prompt 体量保持紧凑
- 事实、偏好和知识都可以持续复用

## 最好的使用方式

- 让它占据主 `memory` 和 `contextEngine` 槽位
- 让 SQLite 留在本地
- 让 `bamdra-user-bind` 管身份和画像
- 让 `bamdra-memory-vector` 管 Markdown 知识和语义召回

## 架构图

- [架构图](/zh/guide/architecture)
