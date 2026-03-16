# bamdra-memory 产品概览

## 它带来的变化

`bamdra-memory` 解决的不是“多几个工具”这么简单，而是让长会话重新变得连贯。

没有它时，一段会话很容易变成这样：

- 先聊旅游
- 中途岔到吃什么
- 又插进来一个工作任务
- 回到前面的话题时，已经接不上了

有了 `bamdra-memory` 之后，体验更接近：

- 旧话题能被安静地接回来
- 稳定事实可以保存一次，后面直接复用
- 当前上下文保持精简，而不是每次都重放整段聊天
- 重启后仍然能恢复有用记忆

## 一个更贴近日常的例子

假设你这样和 OpenClaw 对话：

1. “下个月想在国内找个地方短途旅游。”
2. “如果去成都，先吃什么比较值？”
3. “我刚收到一个工作邮件，帮我礼貌回复一下。”
4. “继续说旅游。如果只有一个周末，成都和杭州选哪个更合适？”
5. “请记住，我订酒店更偏好离地铁站近一点。”

理想效果：

- 工作邮件处理完以后，旅游主线还能自然接上
- assistant 不需要对用户解释内部动作
- “靠近地铁站”这个偏好，后面可以直接拿来用

## 适合谁

- 经常进行长会话、而且中途会被别的事情打断的人
- 希望 assistant 具备实际连续性，而不是每次都重新解释背景的人
- 想要结构化记忆，而不是只靠 prompt 习惯的人
- 默认倾向本地部署、用 SQLite 就能落地的人

## 核心特性

- `规则 + 自然语言驱动的双线保障`
  用明确规则兜底显式切换、边界控制与稳定事实处理，再用自然语言理解让上下文恢复与召回更无感。

- `话题路由`
  在用户回到较早线索时安静地恢复正确上下文。
- `紧凑上下文装配`
  基于 topic 摘要、open loops、最近消息和 pinned facts 生成 prompt。
- `持久化事实模型`
  使用 category、sensitivity、scope、confidence、recall policy 管理事实。
- `SQLite 持久化`
  用 SQLite 保存消息、topic、facts 和 session state。
- `显式记忆工具`
  让智能体可以主动读取和控制记忆。

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

## 主要组件

- `memory-core`
  共享契约与领域模型
- `memory-sqlite`
  SQLite 持久化存储
- `memory-cache-memory`
  默认内存缓存
- `topic-router`
  连续性路由逻辑
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
