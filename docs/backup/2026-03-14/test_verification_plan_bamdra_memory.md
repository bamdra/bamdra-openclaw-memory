# bamdra-memory 插件测试验证方案

## 一、验证目标概述

本方案旨在验证 `bamdra-memory` 插件是否：
1. **正确生效**：插件被正确加载并运行
2. **达到设计目标**：实现话题感知、上下文装配优化，而非全量分析上下文

## 二、服务端检测方案

### 2.1 插件加载状态验证

#### 检测点 1：插件配置文件检查

```bash
# 检查插件配置是否存在
cat ~/.openclaw/openclaw.json | grep -A 20 "bamdra-memory"

# 检查插件目录是否存在
ls -la ~/.openclaw/extensions/bamdra-memory-context-engine/
ls -la ~/.openclaw/extensions/bamdra-memory-tools/
```

**预期结果**：
- 配置文件中包含 `bamdra-memory-context-engine` 和 `bamdra-memory-tools` 配置
- 插件目录存在且包含 `dist/` 目录和 `openclaw.plugin.json`

#### 检测点 2：SQLite 数据库初始化检查

```bash
# 检查数据库文件是否创建
ls -la ~/.openclaw/memory/main.sqlite

# 检查数据库表结构
sqlite3 ~/.openclaw/memory/main.sqlite ".tables"

# 检查表结构详情
sqlite3 ~/.openclaw/memory/main.sqlite ".schema messages"
sqlite3 ~/.openclaw/memory/main.sqlite ".schema topics"
sqlite3 ~/.openclaw/memory/main.sqlite ".schema facts"
sqlite3 ~/.openclaw/memory/main.sqlite ".schema session_state"
```

**预期结果**：
- 数据库文件存在
- 包含 `messages`, `topics`, `topic_membership`, `facts`, `fact_tags`, `session_state` 等表

### 2.2 话题路由功能验证

#### 检测点 3：消息写入验证

进行对话后检查：

```bash
# 检查消息是否被写入
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM messages;"

# 查看最近的消息
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT id, session_id, role, substr(text, 1, 50) as text_preview FROM messages ORDER BY ts DESC LIMIT 10;"
```

**预期结果**：
- 消息数量 > 0
- 能看到用户和助手的消息记录

#### 检测点 4：话题创建与路由验证

```bash
# 检查话题是否被创建
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT id, title, status, created_at FROM topics ORDER BY created_at DESC LIMIT 10;"

# 检查话题成员关系
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT tm.topic_id, t.title, COUNT(tm.message_id) as msg_count FROM topic_membership tm JOIN topics t ON tm.topic_id = t.id GROUP BY tm.topic_id;"

# 检查会话状态
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT * FROM session_state;"
```

**预期结果**：
- 存在多个话题记录
- 消息被正确分配到不同话题
- `session_state` 记录了当前活跃话题

### 2.3 上下文装配验证（核心验证点）

#### 检测点 5：上下文装配日志检查

**方法 A：通过 OpenClaw 日志**

```bash
# 查看 OpenClaw 日志（假设日志在标准位置）
tail -f ~/.openclaw/logs/openclaw.log | grep -i "context\|topic\|memory"

# 或检查最近的日志
grep -i "assembleContext\|topicRouter\|contextEngine" ~/.openclaw/logs/*.log
```

**预期结果**：
- 日志中显示话题路由决策
- 日志中显示上下文装配过程
- **关键**：日志显示只装配了当前话题的相关上下文，而非全量历史

#### 检测点 6：上下文快照检查

```bash
# 检查上下文快照表
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT id, session_id, topic_id, kind, length(content) as content_len FROM context_snapshots ORDER BY created_at DESC LIMIT 5;"

# 查看具体的上下文内容（可选）
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT content FROM context_snapshots ORDER BY created_at DESC LIMIT 1;"
```

**预期结果**：
- 上下文快照内容长度应该远小于全量历史
- 快照内容应该只包含当前话题相关的摘要、最近消息、相关事实

### 2.4 事实持久化验证

#### 检测点 7：事实保存验证

```bash
# 检查事实表
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT id, category, key, value, recall_policy FROM facts;"

# 检查事实标签
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT f.key, ft.tag FROM facts f JOIN fact_tags ft ON f.id = ft.fact_id;"
```

**预期结果**：
- 用户明确要求记住的事实被保存
- 事实有正确的 category 和 recall_policy

### 2.5 Redis 缓存验证（如启用）

#### 检测点 8：Redis 缓存状态

```bash
# 连接 Redis
redis-cli

# 检查缓存键
KEYS openclaw:memory-v2:*

# 检查特定会话的缓存
GET openclaw:memory-v2:session:<session_id>:active_topic

# 检查话题缓存
GET openclaw:memory-v2:topic:<topic_id>:summary
```

**预期结果**：
- Redis 中存在缓存键
- 缓存内容与 SQLite 数据一致

## 三、用户交互测试方案

### 3.1 基础功能测试

#### 测试用例 1：话题自动识别与切换

**测试步骤**：

1. 发送消息 A："我想了解一下成都的旅游攻略"
2. 发送消息 B："如果去成都，火锅和串串哪个更值得尝试？"
3. 发送消息 C（完全不同话题）："帮我写一个 Python 函数，计算斐波那契数列"
4. 发送消息 D："继续说成都旅游，除了吃还有什么推荐的？"

**验证方法**：

```bash
# 检查话题数量
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM topics;"

# 检查话题分配
sqlite3 ~/.openclaw/memory/main.sqlite "
SELECT 
    t.title,
    GROUP_CONCAT(substr(m.text, 1, 30), ' | ') as messages
FROM topics t
JOIN topic_membership tm ON t.id = tm.topic_id
JOIN messages m ON tm.message_id = m.id
GROUP BY t.id;
"
```

**预期结果**：
- 应该至少创建 2 个话题（旅游相关、编程相关）
- 消息 A、B、D 应该归属到旅游话题
- 消息 C 应该归属到编程话题
- 助手回复 D 时应该能自然接上旅游话题的上下文

#### 测试用例 2：事实持久化与召回

**测试步骤**：

1. 发送消息："请记住，我订酒店偏好靠近地铁站，预算在 300-500 元之间"
2. 发送几条其他话题的消息
3. 发送消息："帮我推荐成都的住宿"

**验证方法**：

```bash
# 检查事实是否被保存
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT key, value, category, recall_policy FROM facts WHERE key LIKE '%酒店%' OR key LIKE '%住宿%';"

# 检查事实是否在后续对话中被召回
sqlite3 ~/.openclaw/memory/main.sqlite "
SELECT content FROM context_snapshots 
WHERE content LIKE '%地铁站%' OR content LIKE '%预算%'
ORDER BY created_at DESC LIMIT 1;
"
```

**预期结果**：
- 事实被保存到 `facts` 表
- 后续相关对话的上下文中包含该事实
- 助手回复时应该考虑到"靠近地铁站"和"预算 300-500 元"的偏好

### 3.2 上下文体积控制验证（核心验证点）

#### 测试用例 3：长对话上下文体积对比

**测试步骤**：

1. 进行 20+ 轮对话，涉及 3-4 个不同话题
2. 每个话题 5-7 轮对话
3. 在不同话题间来回切换

**验证方法**：

```bash
# 统计总消息数
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM messages;"

# 统计话题数
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT COUNT(*) FROM topics;"

# 检查最近一次上下文装配的体积
sqlite3 ~/.openclaw/memory/main.sqlite "
SELECT 
    session_id,
    topic_id,
    kind,
    length(content) as context_size_bytes,
    created_at
FROM context_snapshots 
ORDER BY created_at DESC LIMIT 5;
"

# 对比：计算全量历史的体积
sqlite3 ~/.openclaw/memory/main.sqlite "
SELECT SUM(length(text)) as total_history_bytes FROM messages;
"
```

**预期结果**：
- `context_size_bytes` 应该远小于 `total_history_bytes`
- 上下文体积应该保持在相对稳定的范围内（例如 2-5KB），而不是随对话轮数线性增长
- 这是验证"非全量分析上下文"的核心指标

#### 测试用例 4：话题摘要功能验证

**测试步骤**：

1. 在一个话题上进行 10+ 轮对话
2. 切换到其他话题
3. 再切换回来

**验证方法**：

```bash
# 检查话题摘要
sqlite3 ~/.openclaw/memory/main.sqlite "
SELECT 
    title,
    summary_short,
    summary_long,
    open_loops_json
FROM topics 
WHERE summary_short IS NOT NULL;
"
```

**预期结果**：
- 话题应该有摘要（summary_short/summary_long）
- 摘要应该概括了话题的核心内容
- 切换回来时，助手应该基于摘要快速恢复上下文

### 3.3 重启恢复测试

#### 测试用例 5：进程重启后状态恢复

**测试步骤**：

1. 进行多轮对话，创建多个话题
2. 记录当前活跃话题 ID
3. 重启 OpenClaw 进程
4. 继续对话

**验证方法**：

```bash
# 重启前记录状态
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT * FROM session_state;"

# 重启 OpenClaw（根据实际部署方式）
# kill <pid> && <restart command>

# 重启后检查状态是否恢复
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT * FROM session_state;"

# 检查是否能继续之前的对话
```

**预期结果**：
- 重启后 `session_state` 应该保持不变
- 助手应该能继续之前的对话上下文
- 不需要重新告诉助手之前的信息

### 3.4 显式工具调用测试

#### 测试用例 6：memory_list_topics 工具

**测试步骤**：

发送消息："列出我们聊过的所有话题"

**验证方法**：

```bash
# 检查工具是否被调用（通过日志）
grep "memory_list_topics" ~/.openclaw/logs/*.log

# 对比数据库中的话题
sqlite3 ~/.openclaw/memory/main.sqlite "SELECT id, title FROM topics;"
```

**预期结果**：
- 助手应该调用 `memory_list_topics` 工具
- 返回的话题列表应该与数据库一致

#### 测试用例 7：memory_save_fact 工具

**测试步骤**：

发送消息："记住我的工作邮箱是 work@example.com"

**验证方法**：

```bash
# 检查事实是否被保存
sqlite3 ~/.openclaw/memory/main.sqlite "
SELECT * FROM facts WHERE value LIKE '%work@example.com%';
"
```

**预期结果**：
- 事实被保存到数据库
- 后续对话中助手应该能记住这个信息

#### 测试用例 8：memory_search 工具

**测试步骤**：

1. 先保存一些事实
2. 发送消息："搜索关于邮箱的信息"

**验证方法**：

```bash
# 检查搜索工具是否被调用
grep "memory_search" ~/.openclaw/logs/*.log
```

**预期结果**：
- 助手调用 `memory_search` 工具
- 返回相关的事实和话题

## 四、自动化验证脚本

### 4.1 一键检测脚本

创建文件 `verify-bamdra-memory.sh`：

```bash
#!/bin/bash

echo "=== bamdra-memory 插件验证脚本 ==="
echo ""

DB_PATH="$HOME/.openclaw/memory/main.sqlite"

# 1. 检查插件配置
echo "1. 检查插件配置..."
if [ -f "$HOME/.openclaw/openclaw.json" ]; then
    if grep -q "bamdra-memory" "$HOME/.openclaw/openclaw.json"; then
        echo "   ✓ 插件配置存在"
    else
        echo "   ✗ 插件配置不存在"
    fi
else
    echo "   ✗ OpenClaw 配置文件不存在"
fi

# 2. 检查插件目录
echo ""
echo "2. 检查插件目录..."
if [ -d "$HOME/.openclaw/extensions/bamdra-memory-context-engine" ]; then
    echo "   ✓ context-engine 插件目录存在"
else
    echo "   ✗ context-engine 插件目录不存在"
fi

if [ -d "$HOME/.openclaw/extensions/bamdra-memory-tools" ]; then
    echo "   ✓ memory-tools 插件目录存在"
else
    echo "   ✗ memory-tools 插件目录不存在"
fi

# 3. 检查数据库
echo ""
echo "3. 检查数据库..."
if [ -f "$DB_PATH" ]; then
    echo "   ✓ 数据库文件存在"
    
    # 检查表
    TABLES=$(sqlite3 "$DB_PATH" ".tables")
    if echo "$TABLES" | grep -q "messages"; then
        echo "   ✓ messages 表存在"
    fi
    if echo "$TABLES" | grep -q "topics"; then
        echo "   ✓ topics 表存在"
    fi
    if echo "$TABLES" | grep -q "facts"; then
        echo "   ✓ facts 表存在"
    fi
    
    # 统计数据
    echo ""
    echo "4. 数据统计..."
    MSG_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM messages;")
    TOPIC_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM topics;")
    FACT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM facts;")
    
    echo "   消息总数: $MSG_COUNT"
    echo "   话题总数: $TOPIC_COUNT"
    echo "   事实总数: $FACT_COUNT"
    
    # 上下文体积分析
    echo ""
    echo "5. 上下文体积分析..."
    if [ "$MSG_COUNT" -gt 0 ]; then
        TOTAL_HISTORY=$(sqlite3 "$DB_PATH" "SELECT SUM(length(text)) FROM messages;")
        echo "   全量历史体积: $TOTAL_HISTORY bytes"
        
        LATEST_CONTEXT=$(sqlite3 "$DB_PATH" "SELECT length(content) FROM context_snapshots ORDER BY created_at DESC LIMIT 1;" 2>/dev/null)
        if [ -n "$LATEST_CONTEXT" ] && [ "$LATEST_CONTEXT" -gt 0 ]; then
            echo "   最新上下文体积: $LATEST_CONTEXT bytes"
            
            RATIO=$((LATEST_CONTEXT * 100 / TOTAL_HISTORY))
            echo "   上下文压缩比: ${RATIO}%"
            
            if [ "$LATEST_CONTEXT" -lt "$TOTAL_HISTORY" ]; then
                echo "   ✓ 上下文体积小于全量历史（核心目标达成）"
            else
                echo "   ✗ 上下文体积未压缩"
            fi
        else
            echo "   暂无上下文快照数据"
        fi
    else
        echo "   暂无消息数据，请先进行对话"
    fi
else
    echo "   ✗ 数据库文件不存在"
fi

echo ""
echo "=== 验证完成 ==="
```

使用方法：

```bash
chmod +x verify-bamdra-memory.sh
./verify-bamdra-memory.sh
```

### 4.2 对话测试脚本

创建文件 `test-conversation.sh`：

```bash
#!/bin/bash

# 这个脚本需要配合 OpenClaw 的 API 或 CLI 使用
# 以下为示例框架

echo "=== 开始对话测试 ==="

# 测试 1：话题切换
echo "测试 1: 话题自动切换"
echo "请依次发送以下消息："
echo "1. '我想了解成都旅游'"
echo "2. '成都火锅怎么样'"
echo "3. '帮我写个 Python 函数'"
echo "4. '继续说成都旅游'"
echo ""
echo "然后运行: sqlite3 ~/.openclaw/memory/main.sqlite 'SELECT title FROM topics;'"
echo "预期：应该看到至少 2 个话题"
echo ""

# 测试 2：事实保存
echo "测试 2: 事实保存"
echo "请发送消息：'记住我的邮箱是 test@example.com'"
echo "然后运行: sqlite3 ~/.openclaw/memory/main.sqlite 'SELECT * FROM facts;'"
echo "预期：应该看到邮箱事实被保存"
echo ""

# 测试 3：上下文体积
echo "测试 3: 上下文体积控制"
echo "请进行 20+ 轮对话，然后运行："
echo "sqlite3 ~/.openclaw/memory/main.sqlite \"SELECT SUM(length(text)) FROM messages;\""
echo "sqlite3 ~/.openclaw/memory/main.sqlite \"SELECT length(content) FROM context_snapshots ORDER BY created_at DESC LIMIT 1;\""
echo "预期：上下文体积应该远小于全量历史"
```

## 五、验证检查清单

### 5.1 服务端检查清单

| 检查项 | 检查命令 | 预期结果 | 实际结果 |
|--------|----------|----------|----------|
| 插件配置存在 | `grep bamdra ~/.openclaw/openclaw.json` | 找到配置 | |
| 插件目录存在 | `ls ~/.openclaw/extensions/bamdra-memory-*` | 目录存在 | |
| 数据库文件存在 | `ls ~/.openclaw/memory/main.sqlite` | 文件存在 | |
| 消息表有数据 | `sqlite3 ... "SELECT COUNT(*) FROM messages;"` | > 0 | |
| 话题表有数据 | `sqlite3 ... "SELECT COUNT(*) FROM topics;"` | > 0 | |
| 话题路由生效 | 检查 topic_membership | 消息被分配到话题 | |
| 上下文体积压缩 | 对比 context_snapshots 和 messages | 上下文 < 全量历史 | |
| 事实持久化 | `SELECT * FROM facts` | 事实被保存 | |

### 5.2 用户交互检查清单

| 测试场景 | 测试步骤 | 预期效果 | 实际效果 |
|----------|----------|----------|----------|
| 话题自动切换 | 聊旅游→聊编程→回到旅游 | 能自然接上旅游话题 | |
| 事实保存与召回 | 说"记住X"，后续问相关话题 | 助手记住并使用X | |
| 长对话上下文 | 20+轮对话后继续 | 上下文体积不爆炸 | |
| 重启恢复 | 重启后继续对话 | 能恢复之前上下文 | |
| 工具调用 | 要求列出话题/搜索事实 | 工具被正确调用 | |

## 六、关键指标定义

### 6.1 核心成功指标

1. **上下文压缩率** = (上下文体积 / 全量历史体积) × 100%
   - 目标：< 30%
   - 优秀：< 10%

2. **话题路由准确率** = (正确分配的消息数 / 总消息数) × 100%
   - 目标：> 80%

3. **事实召回成功率** = (成功召回的事实数 / 应召回的事实数) × 100%
   - 目标：> 90%

4. **重启恢复成功率** = 重启后能正确恢复上下文的次数 / 总重启次数
   - 目标：100%

### 6.2 失败判定标准

出现以下情况视为插件未达到设计目标：

1. 上下文体积 ≥ 全量历史体积
2. 所有消息都被分配到同一个话题
3. 用户明确要求记住的事实未被保存
4. 重启后无法恢复任何上下文
5. 助手每次都像新对话一样，无法记住之前的信息

## 七、问题排查指南

### 7.1 插件未加载

**症状**：数据库文件不存在，无话题路由

**排查步骤**：
1. 检查 `~/.openclaw/openclaw.json` 配置是否正确
2. 检查插件目录是否有 `dist/` 和 `openclaw.plugin.json`
3. 查看 OpenClaw 启动日志是否有错误

### 7.2 话题未正确路由

**症状**：所有消息都在一个话题中

**排查步骤**：
1. 检查 `topic_router` 配置阈值
2. 查看日志中的路由决策
3. 检查消息文本是否有明显的话题区分

### 7.3 上下文体积未压缩

**症状**：上下文体积接近全量历史

**排查步骤**：
1. 检查 `context_assembly` 配置
2. 检查话题摘要是否生成
3. 检查 `recentTurns` 参数是否过大

### 7.4 事实未召回

**症状**：保存的事实在后续对话中未被使用

**排查步骤**：
1. 检查 `recall_policy` 是否正确
2. 检查事实的 `tags` 是否匹配当前话题
3. 检查 `alwaysFactLimit` 和 `topicFactLimit` 配置

## 八、总结

本测试验证方案从服务端检测和用户交互两个维度，全面验证 `bamdra-memory` 插件的功能和性能。

**核心验证点**：
1. **上下文体积控制**：通过对比 `context_snapshots` 和 `messages` 表的数据量，验证插件是否真正实现了"非全量分析上下文"
2. **话题路由**：通过检查 `topics` 和 `topic_membership` 表，验证消息是否被正确分配到不同话题
3. **事实持久化**：通过检查 `facts` 表，验证用户明确要求记住的信息是否被保存
4. **重启恢复**：通过重启前后对比，验证状态是否能从 SQLite 恢复

建议按照本方案逐一执行验证，并记录实际结果，确保插件真正达到设计目标。
