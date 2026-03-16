import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");

const sqliteSrcPath = resolve(repoRoot, "packages", "memory-sqlite", "src", "schema.sql");
const sqliteDistPath = resolve(repoRoot, "packages", "memory-sqlite", "dist", "schema.sql");

if (existsSync(sqliteSrcPath)) {
  if (!existsSync(resolve(repoRoot, "packages", "memory-sqlite", "dist"))) {
    mkdirSync(resolve(repoRoot, "packages", "memory-sqlite", "dist"), { recursive: true });
  }
  cpSync(sqliteSrcPath, sqliteDistPath);
  console.log("✓ Copied schema.sql to memory-sqlite/dist/");
} else {
  console.error("✗ schema.sql not found in memory-sqlite/src/");
  process.exit(1);
}
