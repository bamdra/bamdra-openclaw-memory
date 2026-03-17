---
title: bamdra-memory-vector
description: 看清知识库与语义召回插件是如何把本地 Markdown 变成真正可用的知识系统的。
---

# bamdra-memory-vector

## 它是什么

`bamdra-memory-vector` 是这套系统中的本地知识库与语义召回层。

它可以独立运行，但和 `bamdra-openclaw-memory` 配合时价值最大。

## 它解决什么问题

只有连续性还不够。

团队还需要一层能力，来做到：

- 知识文件保持可读
- 能在运行时外部直接编辑
- 用户模糊提问时仍然能找回相关内容
- 尽量减少不必要的 web search

这正是它补上的空白。

## 核心能力

- 基于文件系统的本地知识根目录
- 私有与共享 Markdown 分离
- 面向模糊提问的语义召回
- 本地优先，再决定是否上网
- 自动索引 `knowledge/`、`docs/`、`notes/`、`ideas/`

## 知识库目录最佳实践

推荐结构：

```text
private/
  knowledge/
  docs/
  notes/
  ideas/

shared/
  knowledge/
  docs/
  notes/
  ideas/
```

建议这样理解：

- `knowledge/` 放稳定、可复用知识
- `docs/` 放正式文档、说明、变更记录
- `notes/` 放会议纪要、过程记录、临时笔记
- `ideas/` 放尚未成熟但值得检索的想法
- `_runtime/` 放系统自动生成内容

## 最佳实践配置

把索引留在本地，把 Markdown 根目录指向你会同步和维护的目录。

例如：

```json
{
  "enabled": true,
  "privateMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/private",
  "sharedMarkdownRoot": "~/Documents/Obsidian/MyVault/openclaw/shared",
  "indexPath": "~/.openclaw/memory/vector/index.json"
}
```

这很适合：

- 用 Obsidian 编辑知识库
- 用 iCloud 或 Syncthing 做同步
- 用 Git 管理文档变更
- 在不引入外部向量基础设施的前提下保持本地检索速度

## 它真正特别的地方

这个插件并不是想变成一个重型外部向量系统。

它真正的优势是让知识库同时具备：

- 本地
- 可读
- 可编辑
- 带用户边界
- 适合日常工作长期维护

## 最理想的使用方式

推荐的使用流程是：

1. 用 Markdown 书写和整理知识
2. 让插件自动在本地完成索引
3. 让 OpenClaw 在上网之前优先查本地知识
4. 明确地区分私有知识和共享知识

## 跟其他插件组合后会得到什么

和 `bamdra-openclaw-memory` 组合时：

- 模糊表达下的旧决策更容易找回
- 本地文档能直接进入上下文，而不是靠 prompt 硬塞

和 `bamdra-user-bind` 组合时：

- 私有知识会继续保持用户边界
- 本地召回也能遵守身份和隐私限制

## 仓库地址

- [GitHub 首页](https://github.com/bamdra)
- [仓库地址](https://github.com/bamdra/bamdra-memory-vector)
