---
title: 下载资源
description: Bamdra OpenClaw 套件的下载入口、仓库入口与推荐安装顺序。
---

# 下载资源

## 最快方式

优先使用一键安装：

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

## 发布资源

- [SQLite 本地配置样例](/downloads/openclaw.plugins.bamdra-memory.local.merge.json)
- [完整套件配置样例](/downloads/openclaw.plugins.bamdra-memory.suite.merge.json)
- [安装速记说明](/downloads/INSTALL.txt)

## 源码与包地址

- [GitHub 首页](https://github.com/bamdra)
- [bamdra-openclaw-memory](https://github.com/bamdra/bamdra-openclaw-memory)
- [bamdra-user-bind](https://github.com/bamdra/bamdra-user-bind)
- [bamdra-memory-vector](https://github.com/bamdra/bamdra-memory-vector)
- [Clawdhub Skill：bamdra-memory-upgrade-operator](/zh/guide/upgrade-operator)
- [npm: @bamdra/bamdra-openclaw-memory](https://www.npmjs.com/package/@bamdra/bamdra-openclaw-memory)
- [npm: @bamdra/bamdra-user-bind](https://www.npmjs.com/package/@bamdra/bamdra-user-bind)
- [npm: @bamdra/bamdra-memory-vector](https://www.npmjs.com/package/@bamdra/bamdra-memory-vector)

## 已安装用户

如果你本地已经装过整套插件，但重装时被旧配置或旧插件目录卡住，直接安装独立修复 skill：

```bash
clawdhub --workdir ~/.openclaw --dir skills install bamdra-memory-upgrade-operator --force
```

## 推荐顺序

1. 先安装主包
2. 确认整套插件已经就位
3. 如有需要，再配置私有和共享知识根目录
4. 让画像、记忆和知识库一起开始积累
