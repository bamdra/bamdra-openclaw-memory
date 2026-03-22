---
title: 升级 Skill
description: 通过独立的 Clawdhub skill，安全修复、卸载、重装或升级 Bamdra OpenClaw memory 套件。
---

# 升级 Skill

`bamdra-memory-upgrade-operator` 是一个独立发布的运维 skill，专门给已经在本地装过 Bamdra 套件、但当前状态不干净的用户使用。

适合这些场景：

- `plugin already exists`
- 因为旧 `openclaw.json` 造成的 `plugin not found`
- `bamdra-openclaw-memory`、`bamdra-user-bind`、`bamdra-memory-vector` 三者处于半安装或不同步状态

## 通过 Clawdhub 安装

把它直接安装到 OpenClaw 的技能目录：

```bash
clawdhub --workdir ~/.openclaw --dir skills install bamdra-memory-upgrade-operator --force
```

安装后，skill 会位于：

```text
~/.openclaw/skills/bamdra-memory-upgrade-operator
```

## 它会做什么

这个 skill 自带的是一条“先备份、再处理”的升级脚本。

在真正改动套件之前，它可以：

- 备份 `~/.openclaw/openclaw.json`
- 从配置里移除旧的 Bamdra 插件引用
- 把旧的 Bamdra 插件目录和 skill 目录移动到备份区
- 重新执行 `openclaw plugins install @bamdra/bamdra-openclaw-memory`
- 如果安装失败，自动恢复旧配置和旧目录

## 用户怎么说

你可以直接让 agent 用自然语言调用它，例如：

```text
用 bamdra-memory-upgrade-operator 安全升级我的 Bamdra memory 套件。
```

或者：

```text
用 bamdra-memory-upgrade-operator 安全卸载 Bamdra memory 套件，不要把 openclaw.json 弄坏。
```

## 脚本支持的动作

- `upgrade`
- `install`
- `uninstall`

如果你要手工执行，也可以直接跑：

```bash
node ~/.openclaw/skills/bamdra-memory-upgrade-operator/scripts/upgrade-bamdra-memory.cjs upgrade
```

## 为什么要单独做这个 Skill

OpenClaw 的常规插件安装流程很适合“全新干净安装”，但对已经装过旧版本、或者当前本地状态已经半损坏的用户来说，直接手工删目录和手改 `openclaw.json` 风险太高。这个 skill 的意义，就是给这些老用户一个可控的修复入口。
