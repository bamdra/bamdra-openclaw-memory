import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

test("memory_save_fact pins a fact and memory_compact_topic refreshes summary", async () => {
  const { contextEngine, tools, close } = await createMemoryFixture();

  await contextEngine.routeAndTrack("session-a", "先聊 OpenClaw memory sqlite 架构");
  await contextEngine.routeAndTrack("session-a", "继续处理 sqlite 和 context assembly");

  const topics = await tools.tools.memory_list_topics({ sessionId: "session-a" });
  const activeTopic = topics.find((topic) => topic.isActive);
  assert.ok(activeTopic);

  const saved = await tools.tools.memory_save_fact({
    sessionId: "session-a",
    key: "workspace.default",
    value: "/Users/mac/.openclaw/workspace-main",
    category: "environment",
    recallPolicy: "always",
    tags: ["workspace", "openclaw"],
  });
  assert.equal(saved.topicId, activeTopic.id);
  assert.equal(saved.tags.includes("workspace"), true);

  const compacted = await tools.tools.memory_compact_topic({
    sessionId: "session-a",
    topicId: activeTopic.id,
  });
  assert.equal(compacted.id, activeTopic.id);
  assert.match(compacted.summaryLong, /workspace\.default=\/Users\/mac\/.openclaw\/workspace-main/);

  const assembled = await contextEngine.assembleContext("session-a");
  assert.match(assembled.text, /workspace\.default: \/Users\/mac\/.openclaw\/workspace-main/);
  await close();
});
