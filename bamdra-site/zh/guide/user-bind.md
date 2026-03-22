---
title: bamdra-user-bind
description: 看清身份与画像插件的作用、亮点、最佳实践，以及为什么它会让智能体越来越懂用户。
---

# bamdra-user-bind

## 它是什么

`bamdra-user-bind` 是这套系统中的身份与画像层。

它本身可以独立运行，但和 `bamdra-openclaw-memory` 配合时价值会非常明显。

## 它解决什么问题

很多运行时只能拿到渠道里的原始 sender ID。

这会带来三个问题：

- 同一个真人可能被拆成多个身份
- 记忆边界不稳定
- 个性化只能停留在短会话里

`bamdra-user-bind` 通过建立稳定用户模型，解决的正是这一层断裂。

## 核心能力

- 渠道感知的身份解析
- 面向飞书的身份转换
- 本地 SQLite 画像主库
- 可编辑的 per-user Markdown 镜像
- 面向管理员的自然语言管理能力
- 运行时画像注入

## 它最让人惊喜的地方

它不只是做 `OpenID -> UserID` 映射。

它实际上会逐渐变成用户的“活画像层”：

- 应该怎么称呼这个人
- 这个人的时区是什么
- 这个人偏好什么语气和表达方式
- 这个人的角色是什么
- 这个人长期喜欢怎样和智能体协作

也就是说，它会逐步代替大部分 per-user `USER.md` 的职责。

## 最佳实践

### 用 SQLite 作为受控主源

运行时主库存放在：

```text
~/.openclaw/data/bamdra-user-bind/profiles.sqlite
```

### 让人维护 Markdown 镜像

用户画像镜像建议放在：

```text
~/.openclaw/data/bamdra-user-bind/profiles/private/{userId}.md
```

也可以把它改到私有 Obsidian 仓库里。

现在这份镜像的结构也更清晰了：

- frontmatter 是运行时真正读写的机器主源
- 正文里的“已确认画像”是同一份结构化字段的人类可读镜像
- “补充备注”只保留不适合结构化的长期上下文

### 保持镜像私有

画像镜像不应该进入不受控的共享知识扫描路径。

这样才能同时满足：

- 人可读、可改
- agent 不会扫全库
- 运行时仍有稳定、安全的主源

## 最理想的使用方式

最好的使用顺序是：

1. 先让插件自动完成身份绑定
2. 再逐步维护用户画像 Markdown
3. 让运行时把这些偏好注入后续会话
4. 管理员只在修正、合并、审计、重同步时介入

## 画像更新语义

现在的画像更新不再只有“整段覆盖”这一种行为。

当用户长期偏好发生变化时，运行时会区分三种语义动作：

- `replace`：用户在纠正或替换旧偏好
- `append`：用户是在补充一个新的长期特征，并没有撤销旧特征
- `remove`：用户明确希望去掉某一个旧偏好或旧特征

这对 `preferences`、`personality`、`notes` 这些字段尤其重要，因为它们很多时候更适合增量维护，而不是粗暴覆盖。

## 渠道作用域身份与 provisional 归并

现在用户画像主键会带 channel 作用域，所以 Feishu、Telegram、WhatsApp、Discord、Google Chat、Slack、Mattermost、Signal、iMessage、Microsoft Teams 这些渠道的画像归属会更清楚。

当稳定绑定暂时拿不到时，运行时也不会先把用户刚说的长期偏好丢掉，而是会：

- 先写一份 provisional 画像
- 在后台继续主动补绑定
- 一旦补到真实绑定，再把这份 provisional 画像自动归并到正式画像

这样即使身份修复稍晚一步，用户刚表达的稳定偏好也不会白白丢失。

## 跟其他插件组合后会发生什么

和 `bamdra-openclaw-memory` 组合时：

- 长期事实会变成真正的 user-aware 记忆
- 个性化会跨 session、跨重启持续存在

和 `bamdra-memory-vector` 组合时：

- 私有画像相关笔记也能影响本地召回
- 私有知识和共享知识仍然能被严格区分

## 管理员能力

这个插件会单独提供管理员 skill 和工具，管理员可以：

- 查询画像
- 用自然语言改字段
- 合并重复绑定
- 巡检问题
- 触发修复和同步

这部分能力刻意和普通用户访问分开，避免越权探测。

## 仓库地址

- [GitHub 首页](https://github.com/bamdra)
- [仓库地址](https://github.com/bamdra/bamdra-user-bind)
