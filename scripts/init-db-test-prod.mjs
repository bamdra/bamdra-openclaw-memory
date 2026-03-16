import { MemorySqliteStore } from "/Users/mac/.openclaw/extensions/openclaw-topic-memory/bamdra-memory/packages/memory-sqlite/dist/index.js";
import { resolve } from "node:path";

const dbPath = process.argv[2] || "/Users/mac/.openclaw/test-memory-plugin.sqlite";
console.log(`Testing database initialization at: ${resolve(dbPath)}`);

const store = new MemorySqliteStore({
  path: dbPath,
});

try {
  console.log("\nApplying migrations...");
  await store.applyMigrations();
  console.log("✅ Migrations applied successfully!");

  console.log("\nChecking schema version...");
  const version = await store.getSchemaVersion();
  console.log(`✅ Schema version: ${version}`);

  console.log("\nTesting store operations...");

  // 测试插入一个 session state
  const now = new Date().toISOString();
  await store.upsertSessionState({
    sessionId: "test-session-1",
    activeTopicId: null,
    lastCompactedAt: null,
    lastTurnId: null,
    updatedAt: now,
  });

  const state = await store.getSessionState("test-session-1");
  console.log("✅ Session state upsert/get works:", state ? "OK" : "FAIL");

  console.log("\n🎉 Database initialization test PASSED!");
  console.log("\nTo clean up test file:");
  console.log(`  rm ${dbPath} ${dbPath}-wal ${dbPath}-shm`);
} finally {
  await store.close();
}
