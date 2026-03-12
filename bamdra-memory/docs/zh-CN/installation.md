# bamdra-memory 安装指南

## 你最终会得到什么

安装完成后，OpenClaw 的实际体验会变成这样：

- 你可以先聊一件事，中途处理另一件事，再自然接回原话题
- 说过一次的重要路径、约束、偏好，不需要反复重复
- 工作打断不会把前面的思路冲散
- 重启后，记忆不会因为窗口清空就消失

这不是“多一个技术组件”，而是让长会话终于有连续性。

## 最适合谁装

如果你符合下面任意一条，就值得装：

- 你经常和 OpenClaw 长时间协作
- 你经常在一次对话里被别的事情打断
- 你讨厌反复告诉模型相同路径、约束和背景
- 你希望 agent 能记住一些长期有效的信息

## 安装前准备

你需要：

- Node.js 22.x 或更高
- pnpm 10.x
- 一个本地可写目录给 SQLite
- 已经能正常运行的 OpenClaw

可选：

- Redis，如果你确实需要共享热缓存

## 推荐安装方式

对普通用户来说，推荐方式是：

1. 下载已经编译好的 release 版本
2. 把插件目录放到 `~/.openclaw/extensions/`
3. 在 `~/.openclaw/openclaw.json` 里启用它们

本地编译更适合开发者。

## 开发者从源码构建

```bash
git clone <你的 fork 或 release 源码地址>
cd openclaw-topic-memory
pnpm install
```

## 第二步：构建插件

```bash
pnpm build
```

如果你想先确认代码是健康的，再执行：

```bash
pnpm test
```

## 第三步：准备 SQLite 目录

```bash
mkdir -p ~/.openclaw/memory
```

默认推荐数据库路径：

```text
~/.openclaw/memory/main.sqlite
```

## 第四步：把插件目录接入 OpenClaw

OpenClaw 需要加载这两个目录：

- `~/.openclaw/extensions/bamdra-memory-context-engine`
- `~/.openclaw/extensions/bamdra-memory-tools`

也就是说，你不是把代码“发布”到哪里，而是让 OpenClaw 直接从本地目录加载插件。

## 第五步：修改 `~/.openclaw/openclaw.json`

打开：

```text
~/.openclaw/openclaw.json
```

把下面这些内容合并进去，不要粗暴覆盖整个 `plugins` 对象。

### 最常用安装方式：SQLite + 本地内存缓存

你可以参考：

- [openclaw.plugins.bamdra-memory.local.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.local.merge.json)

核心结构是：

```json
{
  "plugins": {
    "enabled": true,
    "allow": [
      "bamdra-memory-context-engine"
    ],
    "load": {
      "paths": [
        "~/.openclaw/extensions/bamdra-memory-context-engine"
      ]
    },
    "slots": {
      "contextEngine": "bamdra-memory-context-engine"
    },
    "entries": {
      "bamdra-memory-context-engine": {
        "enabled": true,
        "config": {
          "enabled": true,
          "store": {
            "provider": "sqlite",
            "path": "~/.openclaw/memory/main.sqlite"
          },
          "cache": {
            "provider": "memory",
            "maxSessions": 128
          }
        }
      }
    }
  }
}
```

### 如果你还想让 agent 主动调用记忆工具

再把工具插件也加进去：

- [openclaw.plugins.bamdra-memory.redis.merge.json](../../examples/configs/openclaw.plugins.bamdra-memory.redis.merge.json)
- [openclaw.plugins.bamdra-memory-tools.json](../../examples/configs/openclaw.plugins.bamdra-memory-tools.json)

最关键的是：

- `plugins.allow` 里要包含 `bamdra-memory-tools`
- `plugins.load.paths` 里要加 tools 插件目录
- `plugins.entries` 里要加 `bamdra-memory-tools`

## 第六步：重启 OpenClaw

配置改完后，重启 OpenClaw。

## 怎么判断安装成功

你可以用下面这种真实对话测试：

1. “下个月去哪边旅游比较好？”
2. “如果去大阪，有哪些一定要吃的东西？”
3. “我刚收到一个工作邮件，帮我写个礼貌回复，说我明天上午发文件过去。”
4. “继续说旅游。如果只有一个短周末，大阪和京都哪个更适合吃东西？”

如果安装正常，实际效果应该是：

- 旅游线索在处理完工作邮件后还能自然接上
- “吃什么”这条支线仍然和旅游主线保持关联
- 工作邮件不会污染后面的旅游建议

## 推荐继续做的一步

安装完成之后，最好再补这份文档：

- [提示词与文件写法](./prompting.md)

因为插件接上只是第一步。真正决定体验的是：agent 知不知道什么时候该保存、搜索、切 topic。
