---
title: 安装部署
description: 用一条命令安装 Bamdra OpenClaw 套件，并看清楚安装过程中哪些事情已经自动完成。
---

# 安装部署

## 推荐安装方式

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

这是最推荐的安装路径。

## 安装时会自动完成什么

当你安装 `@bamdra/bamdra-openclaw-memory` 时，bootstrap 现在会自动完成这些事：

- 创建本地 memory 目录
- 安装主连续性运行时
- 自动补齐 `bamdra-user-bind`
- 一并准备 `bamdra-memory-vector`
- 把随包 skills 复制到 `~/.openclaw/skills/`
- 把 `memory` 和 `contextEngine` 槽位绑定到 `bamdra-openclaw-memory`

对用户来说，它应该就是“一条命令安装整套能力”。

安装完成后，建议把 prompt 分工也一起收口：

- 默认称呼、昵称、时区、长期语气偏好等稳定画像字段交给 `bamdra-user-bind`
- workspace 里的 `USER.md` 尽量保持很薄，只写环境事实，不再重复身份层信息

## 为什么这样很重要

用户不应该还需要：

- 为了身份层再执行第二次安装
- 手工创建 memory 目录
- 安装完主插件之后，过一阵才发现知识库层根本没准备好

安装体验必须像一个成品，而不是拼装说明书。

## 安装完成后建议做什么

### 1. 重启 OpenClaw

配置变更需要 gateway 重启。

### 2. 确认三个插件都在

现在 OpenClaw 里应该已经有：

- `bamdra-openclaw-memory`
- `bamdra-user-bind`
- `bamdra-memory-vector`

### 3. 决定你的知识库放在哪里

推荐方式：

- SQLite 和索引继续留在 `~/.openclaw`
- Markdown 根目录指向你已经会同步和编辑的目录，例如 Obsidian

示例：

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

## 手动安装路径

如果环境不支持 npm 插件安装，仍然可以走 release 包。

1. 下载 release
2. 把 `bamdra-openclaw-memory` 复制到 `~/.openclaw/extensions/`
3. 如有需要，再复制 `bamdra-user-bind` 和 `bamdra-memory-vector`
4. 合并样例配置
5. 重启 OpenClaw

## 安装成功后应该看到什么

安装成功后，你会开始感受到：

- 被打断之后还能自然接回正确分支
- 稳定事实可以持续复用
- 当前用户拥有持续一致的个性化响应
- 本地文档和笔记会在 web search 之前优先进入召回链路

## 建议继续阅读

- [架构图](/zh/guide/architecture)
- [最佳实践](/zh/guide/best-practices)
- [下载资源](/zh/guide/downloads)
