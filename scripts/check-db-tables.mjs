import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";

const dbPath = process.argv[2] || "main.sqlite";
const db = new DatabaseSync(dbPath);
console.log(`Checking database: ${resolve(dbPath)}\n`);

try {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all();

  console.log("Tables in database:");
  for (const table of tables) {
    console.log(`  - ${table.name}`);
  }

  if (tables.length === 0) {
    console.log("\n⚠️  No tables found!");
  } else {
    console.log("\n✅ Tables found!");
    // 检查是否有 schema_migrations 表
    const hasMigration = tables.some(t => t.name === "schema_migrations");
    if (hasMigration) {
      const migrationVersion = db.prepare("SELECT version FROM schema_migrations LIMIT 1").get();
      console.log(`  Schema version: ${migrationVersion.version}`);
    }
  }
} finally {
  db.close();
}
