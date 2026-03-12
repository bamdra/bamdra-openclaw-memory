# bamdra-memory 提示词与文件写法

## 目的

这份文档讲的是 `bamdra-memory` 的“使用侧写法”：在 `AGENTS.md`、`SKILL.md`、`TOOLS.md` 里应该怎么写，才能让 agent 真正把记忆用起来。

这里不讲内部实现，只讲行为效果。

## 好的使用效果应该是什么样

一个接好记忆的 agent，应该做到：

- 用户明确说“记住这个”时，能保存为长期记忆
- 用户切回旧分支时，能回到对应 topic
- 在要求用户重复稳定事实之前，先查记忆
- 尽量把记忆机制藏在背后，而不是每次都解释工具细节

## 一个直观效果

用户先说：

> 记住 staging workspace 是 `/srv/openclaw-staging`。

过一段时间又说：

> 回到刚才 deployment 那条线。那边用的是哪个 workspace？

理想行为是：

- agent 不会再问一遍
- agent 能直接回忆起保存过的路径
- 回复像自然对话，而不是数据库回显

## AGENTS.md 写法示例

建议加一个很短的策略块：

```md
## Memory Usage

- 当用户说“记住这个”时，把它保存为 durable memory。
- 当用户回到较早的话题分支时，尽量切回相关 topic。
- 在要求用户重复一个稳定事实之前，先搜索 memory。
- 记忆机制尽量保持隐形，用来提升连续性，不要频繁讲解内部动作。
```

重点是描述“什么时候用记忆”，而不是把整个实现原理写进 prompt。

## SKILL.md 写法示例

如果你要维护一个本地 memory-operator skill，建议保持很薄、很直接：

```md
# Memory Operator

当连续性重要时，使用 memory tools。

- 对稳定的路径、偏好、环境信息、账号引用和约束，使用 `memory_save_fact`。
- 在要求用户重复事实之前，先用 `memory_search`。
- 当用户回到旧分支时，使用 `memory_list_topics` 和 `memory_switch_topic`。
- 当某个分支方向变化明显时，使用 `memory_compact_topic` 刷新摘要。
```

不要试图在 skill 文本里重写一遍整个记忆系统。

## TOOLS.md 写法示例

`TOOLS.md` 适合放“本机环境专属事实”，方便 agent 后续保存或比对：

```md
## Memory Targets

- default workspace path: /Users/mac/.openclaw/workspace-main
- staging workspace path: /srv/openclaw-staging
- preferred redis db for testing: redis://127.0.0.1:6379/0
```

这样 agent 在写记忆时就会更具体，而不是只记一个模糊描述。

## 对用户可见的表达风格

比较好的说法：

- “我已经切回刚才那条 SQLite 分支了。”
- “这个路径我记下来了。”
- “我从之前的记录里找到了这个账号提示。”

不太好的说法：

- 大段解释 topic ID
- 每次都汇报底层存储动作
- 把正常对话说成 debug 日志

## 推荐落地步骤

1. 在 `AGENTS.md` 加一小段 memory policy。
2. 如果你用 skill，再加一个薄的 operator skill。
3. 在 `TOOLS.md` 里记录环境专属事实。
4. 平时让 agent 安静地使用 memory，除非用户明确要看细节。
