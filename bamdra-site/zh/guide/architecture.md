---
title: 架构图
description: 看清 bamdra-openclaw-memory、bamdra-user-bind 和 bamdra-memory-vector 如何组成一套完整的连续性记忆与知识库系统。
---

# 架构图

## 一键安装

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

这一条命令现在会把完整记忆栈一起准备好：

- `bamdra-openclaw-memory` 作为主运行时
- `bamdra-user-bind` 作为身份与画像层
- `bamdra-memory-vector` 作为本地知识库与语义召回层

三个插件都可以独立运行，但组合起来才真正补齐整个记忆体系。

## 技术架构图

<figure class="doc-figure">
  <img src="/images/architecture-technical-zh.svg" alt="Bamdra 技术架构图" />
  <figcaption>三个插件都能独立运行，但组合起来之后，身份、记忆、知识库三层才真正闭环。</figcaption>
</figure>

## 每个插件分别负责什么

### `bamdra-user-bind`

- 把不稳定的渠道 sender ID 转成稳定用户边界
- 让用户画像既可编辑，又不会被 agent 扫全库
- 代替大部分 per-user `USER.md` 的职责
- 让个性化配置能跨 session、跨重启持续生效

### `bamdra-openclaw-memory`

- 把对话拆分成可恢复的话题分支
- 保持上下文紧凑而相关
- 保存带作用域和隐私边界的长期事实
- 让系统恢复正确分支，而不是整段回放聊天记录

### `bamdra-memory-vector`

- 把本地 Markdown 变成真正可维护的知识库
- 自动索引 `knowledge/`、`docs/`、`notes/`、`ideas/`
- 区分私有知识和共享知识
- 用轻量方式补齐模糊召回，不依赖重型外部向量数据库

## 普通用户实际感受到的效果

<figure class="doc-figure">
  <img src="/images/architecture-user-zh.svg" alt="Bamdra 面向普通用户的介绍图" />
  <figcaption>对普通用户来说，最重要的不是技术名词，而是它真的会越来越懂你，而且优先使用你的本地知识。</figcaption>
</figure>

## 为什么这比“只靠 Prompt 记忆”强很多

- 身份边界是明确的，不再只依赖原始 sender ID
- 长期偏好不需要只塞在 prompt 文本里
- 知识文件可以像正常文档系统一样维护
- 画像、记忆、知识库三条线都可持续积累，所以智能体会随着用户一起进化

这正是这套系统最让人惊喜的地方：

- 它不只是“记住一点东西”
- 而是在用户偏好、长期工作内容、知识文件不断累积之后，逐渐变成一个越来越懂你的协作系统

## 推荐的知识库目录最佳实践

如果你同时管理工作和生活，推荐这样组织：

```text
private/
  knowledge/
    work/
    life/
    projects/
  docs/
    reference/
    manuals/
  notes/
    daily/
    meetings/
  ideas/
    product/
    personal/

shared/
  knowledge/
    team/
    products/
  docs/
    sop/
    changelog/
  notes/
    shared/
  ideas/
    backlog/
```

建议这样理解：

- `knowledge/` 放稳定、可复用的知识
- `docs/` 放正式文档、说明、变更记录
- `notes/` 放过程性记录、会议纪要、随手笔记
- `ideas/` 放暂时不成熟但值得检索的想法
- `_runtime/` 是系统自动维护区，不建议作为人工主编辑目录
