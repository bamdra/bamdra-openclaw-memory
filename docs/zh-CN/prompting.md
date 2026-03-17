# bamdra-memory 提示词与文件写法

## 目的

这份文档讲的是 `bamdra-memory` 的“使用侧写法”：在 `AGENTS.md`、`SKILL.md`、`TOOLS.md` 里应该怎么写，才能让 agent 真正把记忆用起来。

这里不讲内部实现，只讲行为效果。

## 好的使用效果应该是什么样

一个接好记忆的 agent，应该做到：

- 用户明确说“记住这个”时，能保存为长期记忆
- 对话自然回到旧话题时，能安静地接回上下文
- 在要求用户重复稳定事实之前，先查记忆
- 尽量把记忆机制藏在背后，而不是每次都解释工具细节

## 一个直观效果

用户先说：

> 我们刚才在聊国内短途旅游。
> 如果去成都，先吃什么比较值？
> 我突然收到一个工作邮件，先帮我回一下。
> 好，继续说旅游，短周末的话成都和杭州哪个更适合？

理想行为是：

- agent 不会解释自己做了什么内部切换
- agent 会直接回到正确的旅游上下文
- 回复像自然对话，而不是数据库回显

## AGENTS.md 写法示例

建议加一个很短的策略块：

```md
## Memory Usage

- 当用户说“记住这个”时，把它保存为 durable memory。
- 当对话自然回到较早的话题时，尽量安静地恢复相关上下文。
- 在要求用户重复一个稳定事实之前，先搜索 memory。
- 记忆机制尽量保持隐形，用来提升连续性，不要频繁讲解内部动作。
```

重点是描述“什么时候用记忆”，而不是把整个实现原理写进 prompt。

## SKILL.md 写法示例

如果你要维护一个本地 memory-operator skill，建议保持很薄，但要把“判定原则”写清楚，而不是只写工具清单。

这一步是可选增强，不是运行 `bamdra-memory` 的前置依赖。插件发布包里会附带推荐版 skill，但在当前 OpenClaw 里，仍然需要手动把它挂到 `agent.skills` 才会生效：

```md
---
name: memory-operator
description: 当连续性重要时，使用 memory tools；当对话疑似切换 topic、恢复旧话题或需要复用稳定事实时，优先做语义判断。
---

# Memory Operator

当连续性重要时，使用 memory tools，让连续性更自然。

- 先做语义判断，再选工具，不要把短语匹配当成唯一依据。
- 当用户明确要记住某事、某个稳定事实后续大概率要复用时，使用 `memory_save_fact`。
- 当对话疑似回到旧线程时，在要求用户重复之前，先用 `memory_search`。
- 当用户明确要切换、恢复或隔离某个话题分支时，再使用 `memory_list_topics` 或 `memory_switch_topic`。
- 当某个分支已经明显改向、摘要失真时，使用 `memory_compact_topic`。
- 保持 agent / user 隔离，不要跨边界取回不该暴露的记忆。
```

不要试图在 skill 文本里重写一遍整个记忆系统，也不要靠枚举所有“用户可能怎么说”来完成 topic 切换。

## 最佳实践

更推荐的思路是：

- 插件层负责提供稳定、可验证的记忆基础设施
- skill 层负责教 agent 什么时候应该认为“这是新 topic”、“这是回到旧 topic”、“这里需要长期记忆”
- 规则只做少量兜底，不和自然语言表达做穷举对抗

一个更像 AI 产品的 memory skill，应该做到：

- 优先按语义判断 topic 是否变化，而不是只认固定句式
- 在不确定时，宁可保守地留在当前 topic，也不要把无关记忆强行拉进来
- 在回答依赖旧事实时，优先搜索记忆，而不是直接要求用户重复
- 把“记忆在工作”藏在后面，让对话仍然像自然对话

如果要给 operator 一份推荐 skill，建议直接复用仓库里的：

- [`skills/bamdra-memory-operator/SKILL.md`](../../skills/bamdra-memory-operator/SKILL.md)

## TOOLS.md 写法示例

`TOOLS.md` 只适合放“本机环境专属事实”，方便 agent 后续保存或比对：

```md
## Memory Targets

- 默认 workspace 路径：`~/.openclaw/workspace`
- preferred extensions path: ~/.openclaw/extensions
```

这样 agent 在写记忆时就会更具体，而不是只记一个模糊描述。

不要把 `TOOLS.md` 写成 skill 清单、授权表或命令手册。工具能力定义、使用边界和命令写法应当放在 `SKILL.md`。

## 对用户可见的表达风格

比较好的说法：

- “这个偏好我会记住。”
- “接着刚才的话题看，成都可能更适合。”
- “我从之前的记录里找到了这个账号提示。”

不太好的说法：

- 大段解释 topic ID
- 每次都汇报底层存储动作
- 把正常对话说成 debug 日志

## 推荐落地步骤

1. 在 `AGENTS.md` 加一小段 memory policy。
2. 如果你希望 agent 更稳定地调用记忆工具，再加一个薄的 operator skill，并把重点放在“判定原则”而不是“命令手册”。
3. 在 `TOOLS.md` 里记录环境专属事实，而不是能力定义。
4. 平时让 agent 安静地使用 memory，除非用户明确要看细节。
5. 把 agent / user 隔离边界写进 prompt policy，避免为了“连续性”误取不该取的记忆。
