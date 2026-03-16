import { symlinkSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

const baseDir = process.argv[2] || process.cwd();
console.log(`Fixing symlinks in: ${resolve(baseDir)}`);

const packages = [
  "memory-core",
  "memory-sqlite",
  "memory-cache-memory",
  "memory-cache-redis",
  "topic-router",
  "context-assembler",
  "fact-extractor",
  "summary-refresher"
];

const pluginDirs = [
  "plugins/bamdra-memory-context-engine",
  "plugins/bamdra-memory-tools"
];

for (const pluginSubDir of pluginDirs) {
  const pluginNodeModulesAt = resolve(baseDir, pluginSubDir, "node_modules", "@openclaw-enhanced");
  console.log(`\nProcessing: ${pluginSubDir}`);

  // 确保目录存在
  if (!existsSync(pluginNodeModulesAt)) {
    mkdirSync(pluginNodeModulesAt, { recursive: true });
  }

  // 计算插件 dir 到 baseDir 中的 packages 的相对路径
  const pluginDirFull = resolve(baseDir, pluginSubDir);
  const packagesDirFull = resolve(baseDir, "packages");

  for (const pkg of packages) {
    const pkgSource = resolve(packagesDirFull, pkg);
    const pkgDest = resolve(pluginNodeModulesAt, pkg);

    // 删除旧的链接/文件夹（如果存在）
    if (existsSync(pkgDest)) {
      rmSync(pkgDest, { recursive: true });
    }

    // 计算相对路径
    const relativePathToPkg = relative(pluginNodeModulesAt, pkgSource);

    // 创建软链接
    symlinkSync(relativePathToPkg, pkgDest, "dir");
    console.log(`  Linked ${pkg} -> ${relativePathToPkg}`);
  }
}

console.log("\n✅ Symlinks fixed!");

function relative(from, to) {
  const fromParts = from.split(/[\/\\]/).filter(Boolean);
  const toParts = to.split(/[\/\\]/).filter(Boolean);

  // 移除公共前缀
  let commonParts = 0;
  while (commonParts < fromParts.length &&
         commonParts < toParts.length &&
         fromParts[commonParts] === toParts[commonParts]) {
    commonParts++;
  }

  // 构建结果
  const result = [];

  // 回退到公共祖先
  for (let i = commonParts; i < fromParts.length; i++) {
    result.push("..");
  }

  // 添加到目标的路径
  for (let i = commonParts; i < toParts.length; i++) {
    result.push(toParts[i]);
  }

  return result.join("/") || ".";
}
