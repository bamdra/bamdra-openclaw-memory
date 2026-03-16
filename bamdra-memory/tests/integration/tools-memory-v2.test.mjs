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
    value: "~/.openclaw/workspace",
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
  assert.match(compacted.summaryLong, /workspace\.default=~\/.openclaw\/workspace/);

  const assembled = await contextEngine.assembleContext("session-a");
  assert.match(assembled.text, /workspace\.default: ~\/.openclaw\/workspace/);
  await close();
});

test("session-scoped facts remain recallable after restart within the same session", async () => {
  const { contextEngine, tools, close } = await createMemoryFixture();
  const dbPath = contextEngine.config.store.path;

  const saved = await tools.tools.memory_save_fact({
    sessionId: "session-a",
    key: "暗号",
    value: "天空之城",
    category: "background",
    recallPolicy: "always",
    scope: "session",
  });

  assert.equal(saved.topicId, null);
  await close();

  const restarted = await createMemoryFixture({
    store: { provider: "sqlite", path: dbPath },
  });

  const assembled = await restarted.contextEngine.assembleContext("session-a");
  assert.match(assembled.text, /暗号: 天空之城/);

  const search = await restarted.contextEngine.searchMemory({
    sessionId: "session-a",
    query: "天空之城",
    limit: 5,
  });
  assert.equal(search.facts.some((item) => item.fact.value === "天空之城"), true);

  await restarted.close();
});

test("session-scoped facts do not leak into another session", async () => {
  const { contextEngine, tools, close } = await createMemoryFixture();

  await tools.tools.memory_save_fact({
    sessionId: "session-a",
    key: "暗号",
    value: "天空之城",
    category: "background",
    recallPolicy: "always",
    scope: "session",
  });

  const assembled = await contextEngine.assembleContext("session-b");
  assert.equal(assembled.text.includes("天空之城"), false);

  const search = await contextEngine.searchMemory({
    sessionId: "session-b",
    query: "天空之城",
    limit: 5,
  });
  assert.equal(search.facts.some((item) => item.fact.value === "天空之城"), false);

  await close();
});
