import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import * as vectorPlugin from "../../../bamdra-memory-vector/dist/index.js";
import { createMemoryFixture } from "../helpers/memory-fixture.mjs";

const USER_BIND_KEY = "__OPENCLAW_BAMDRA_USER_BIND__";
const VECTOR_KEY = "__OPENCLAW_BAMDRA_MEMORY_VECTOR__";

test("user-scoped facts follow the same user across sessions without leaking to another user", async () => {
  globalThis[USER_BIND_KEY] = {
    getIdentityForSession(sessionId) {
      if (sessionId === "session-a" || sessionId === "session-b") {
        return { userId: "user-1", channelType: "feishu", senderOpenId: "ou_1" };
      }
      if (sessionId === "session-c") {
        return { userId: "user-2", channelType: "feishu", senderOpenId: "ou_2" };
      }
      return null;
    },
  };

  const { contextEngine, tools, close } = await createMemoryFixture();

  await tools.tools.memory_save_fact({
    sessionId: "session-a",
    key: "report.style",
    value: "优先使用表格化汇报",
    category: "preference",
    recallPolicy: "always",
    scope: "user",
  });

  const sameUserContext = await contextEngine.assembleContext("session-b");
  assert.match(sameUserContext.text, /表格化汇报/);

  const otherUserContext = await contextEngine.assembleContext("session-c");
  assert.equal(otherUserContext.text.includes("表格化汇报"), false);

  delete globalThis[USER_BIND_KEY];
  await close();
});

test("vector plugin augments memory search and memory tables use prefixed names", async () => {
  const vectorRoot = mkdtempSync(join(tmpdir(), "bamdra-memory-vector-"));
  const privateRoot = join(vectorRoot, "private-vault");
  const sharedRoot = join(vectorRoot, "shared-vault");
  vectorPlugin.register({
    config: {
      privateMarkdownRoot: privateRoot,
      sharedMarkdownRoot: sharedRoot,
      indexPath: join(vectorRoot, "index.json"),
    },
  });
  globalThis[USER_BIND_KEY] = {
    getIdentityForSession() {
      return { userId: "user-1", channelType: "feishu", senderOpenId: "ou_1" };
    },
  };

  const { contextEngine, dbPath, close } = await createMemoryFixture();
  await contextEngine.routeAndTrack("session-a", "用户偏好使用表格化汇报来同步项目进展");

  const result = await contextEngine.searchMemory({
    sessionId: "session-a",
    query: "表格化汇报",
    limit: 5,
  });
  assert.equal(result.vectors.length >= 1, true);
  assert.equal(result.userId, "user-1");
  assert.equal(existsSync(privateRoot), true);
  assert.equal(existsSync(sharedRoot), true);

  const db = new DatabaseSync(dbPath);
  const tableNames = db.prepare(`
    select name from sqlite_master
    where type = 'table' and name like 'bamdra_memory_%'
    order by name
  `).all().map((row) => row.name);
  db.close();

  assert.equal(tableNames.includes("bamdra_memory_messages"), true);
  assert.equal(tableNames.includes("bamdra_memory_facts"), true);

  delete globalThis[USER_BIND_KEY];
  delete globalThis[VECTOR_KEY];
  await close();
});

test("vector plugin stores shared and private markdown in separate roots and returns shared results", async () => {
  const vectorRoot = mkdtempSync(join(tmpdir(), "bamdra-memory-vector-roots-"));
  const privateRoot = join(vectorRoot, "obsidian-private");
  const sharedRoot = join(vectorRoot, "obsidian-shared");
  vectorPlugin.register({
    config: {
      privateMarkdownRoot: privateRoot,
      sharedMarkdownRoot: sharedRoot,
      indexPath: join(vectorRoot, "index.json"),
    },
  });

  const vectorApi = globalThis[VECTOR_KEY];
  assert.ok(vectorApi);
  vectorApi.upsertMemoryRecord({
    userId: "user-1",
    sessionId: "session-a",
    topicId: "topic-a",
    sourcePath: "user/user-1/facts/private-note.md",
    title: "Private preference",
    text: "用户更喜欢表格化项目周报",
    tags: ["private"],
  });
  vectorApi.upsertMemoryRecord({
    userId: null,
    sessionId: null,
    topicId: null,
    sourcePath: "shared/team/weekly-template.md",
    title: "Shared weekly template",
    text: "团队共享知识库里推荐使用表格化周报模板",
    tags: ["shared"],
  });

  const results = vectorApi.search({
    query: "表格化周报",
    userId: "user-1",
    limit: 5,
  });
  assert.equal(results.some((item) => item.userId === "user-1"), true);
  assert.equal(results.some((item) => item.userId === null), true);
  assert.equal(existsSync(join(privateRoot, "_runtime/user/user-1/topics/topic-a/private-preference.md")), true);
  assert.equal(existsSync(join(sharedRoot, "_runtime/shared/topics/general/shared-weekly-template.md")), true);

  delete globalThis[VECTOR_KEY];
});

test("vector plugin indexes readable knowledge directories and rebuilds after manual edits", async () => {
  const vectorRoot = mkdtempSync(join(tmpdir(), "bamdra-memory-vector-kb-"));
  const privateRoot = join(vectorRoot, "private-vault");
  const sharedRoot = join(vectorRoot, "shared-vault");
  mkdirSync(join(privateRoot, "knowledge"), { recursive: true });
  mkdirSync(join(privateRoot, "ideas"), { recursive: true });
  mkdirSync(join(sharedRoot, "docs"), { recursive: true });
  writeFileSync(join(privateRoot, "knowledge", "focus.md"), "# 当前工作\n\n我现在主要在做 OpenClaw 插件体系重构。\n", "utf8");
  writeFileSync(join(privateRoot, "ideas", "memory.txt"), "未来希望把个人知识库整理成知识、文档、灵感三个区。", "utf8");
  writeFileSync(join(sharedRoot, "docs", "obsidian.md"), "# 团队知识库入口\n\n团队共享知识库默认入口是 Obsidian 仓库。\n", "utf8");

  vectorPlugin.register({
    config: {
      privateMarkdownRoot: privateRoot,
      sharedMarkdownRoot: sharedRoot,
      indexPath: join(vectorRoot, "index.json"),
    },
  });

  const vectorApi = globalThis[VECTOR_KEY];
  assert.ok(vectorApi);
  vectorApi.rebuild();

  const privateResults = vectorApi.search({
    query: "插件体系重构",
    userId: "user-1",
    limit: 5,
  });
  const sharedResults = vectorApi.search({
    query: "Obsidian 仓库",
    userId: "user-1",
    limit: 5,
  });

  assert.equal(privateResults.some((item) => item.sourcePath === "knowledge/focus.md"), true);
  assert.equal(sharedResults.some((item) => item.sourcePath === "docs/obsidian.md"), true);

  writeFileSync(join(privateRoot, "knowledge", "focus.md"), "# 当前工作\n\n我现在主要在做 Bamdra 套件整合与发布。\n", "utf8");
  const updatedResults = vectorApi.search({
    query: "套件整合",
    userId: "user-1",
    limit: 5,
  });
  assert.equal(updatedResults.some((item) => /Bamdra 套件整合/.test(item.text)), true);

  delete globalThis[VECTOR_KEY];
});

test("memory hook proactively resolves identity before tracking so user-scoped facts survive a new session", async () => {
  const identities = new Map();
  globalThis[USER_BIND_KEY] = {
    async resolveIdentity(context) {
      const sessionId = context.sessionId;
      const userId = sessionId === "session-b" ? "user-1" : "user-1";
      const identity = { userId, channelType: "feishu", senderOpenId: "ou_1" };
      identities.set(sessionId, identity);
      return identity;
    },
    getIdentityForSession(sessionId) {
      return identities.get(sessionId) ?? null;
    },
  };

  const { contextEngine, close } = await createMemoryFixture();
  const hooks = [];
  contextEngine.registerHooks({
    registerHook(_events, handler) {
      hooks.push(handler);
    },
  });

  await hooks[0]({
    sessionId: "session-a",
    text: "记住：我现在主要在做 OpenClaw 插件体系重构。",
  });

  await contextEngine.saveFact({
    sessionId: "session-a",
    key: "current.focus",
    value: "OpenClaw 插件体系重构",
    category: "project",
    recallPolicy: "always",
    scope: "user",
  });

  await globalThis[USER_BIND_KEY].resolveIdentity({ sessionId: "session-b" });
  const assembled = await contextEngine.assembleContext("session-b");
  assert.match(assembled.text, /OpenClaw 插件体系重构/);

  delete globalThis[USER_BIND_KEY];
  await close();
});

test("personal long-lived facts default to user scope while explicit shared knowledge stays shared", async () => {
  globalThis[USER_BIND_KEY] = {
    getIdentityForSession() {
      return { userId: "user-1", channelType: "feishu", senderOpenId: "ou_1" };
    },
  };

  const { contextEngine, dbPath, close } = await createMemoryFixture();
  await contextEngine.routeAndTrack("session-a", "记住：我现在主要在做 OpenClaw 插件体系重构。");
  await contextEngine.routeAndTrack("session-a", "记住：团队共享知识库默认入口是 Obsidian 仓库。");

  const db = new DatabaseSync(dbPath);
  const personalFact = db.prepare(`
    select scope, key, value from bamdra_memory_facts
    where key = '当前主要工作'
    order by updated_at desc
    limit 1
  `).get();
  const sharedFact = db.prepare(`
    select scope, key, value from bamdra_memory_facts
    where value like '%Obsidian 仓库%'
    order by updated_at desc
    limit 1
  `).get();
  db.close();

  assert.equal(personalFact.scope, "user:user-1");
  assert.match(personalFact.value, /OpenClaw 插件体系重构/);
  assert.equal(sharedFact.scope, "shared");

  delete globalThis[USER_BIND_KEY];
  await close();
});
