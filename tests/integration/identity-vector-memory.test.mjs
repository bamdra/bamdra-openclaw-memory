import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
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
  vectorPlugin.register({
    config: {
      markdownRoot: join(vectorRoot, "markdown"),
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
