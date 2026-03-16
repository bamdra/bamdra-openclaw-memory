import fs from "node:fs";
import path from "node:path";

const pluginName = process.argv[2];
const distDir = path.resolve("dist");
const projectRoot = path.resolve("../../..");
const sqlSource = path.resolve(projectRoot, "bamdra-memory/packages/memory-sqlite/src/schema.sql");

async function run() {
  if (!pluginName) throw new Error("Usage: node ... <plugin-name>");

  console.log(`🚀 正在为 ${pluginName} 执行开源级加固与路径修复...`);

  const pluginRoot = process.cwd();
  const indexPath = path.join(distDir, "index.js");

  // 1. 确保资源归位
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  if (fs.existsSync(sqlSource)) fs.copyFileSync(sqlSource, path.join(distDir, "schema.sql"));

  // 2. 🛡️ 核心修复：协议补丁 + 导出加固 + 语法修复
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, "utf8");
    
    // --- A. 修复 node: 协议 ---
    const builtins = ["sqlite", "fs", "path", "url", "promises", "events", "fs/promises"];
    builtins.forEach((mod) => {
      const regex = new RegExp(`require\\(["']${mod}["']\\)`, "g");
      content = content.replace(regex, `require("node:${mod}")`);
    });

    // --- B. 修复 CJS 导出 (彻底修复 0 && (...) 语法错误) ---
    const exportRegex = /0\s*&&\s*\(module\.exports\s*=\s*\{([\s\S]*?)\}\);/m;
    if (exportRegex.test(content)) {
      content = content.replace(exportRegex, (match, exports) => {
        return `module.exports = {${exports.trim()}};`;
      });
      console.log("✅ 导出语法已修复 (已移除悬挂括号)");
    } else if (!content.includes('module.exports =')) {
      content += '\n\nmodule.exports = { activate, register, createContextEngineMemoryV2Plugin };\n';
      console.log("✅ 已手动补全导出语句");
    }

    fs.writeFileSync(indexPath, content);
  }

  // 3. 🛡️ 路径修正：确保分发后的清单指向正确的 index.js
  const sourcePackage = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));
  const sourceManifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, "openclaw.plugin.json"), "utf8"));

  // 修正 package.json 中的路径
  const distPackage = {
    ...sourcePackage,
    type: "commonjs",
    main: "./index.js", // 👈 强制修正
    openclaw: {
      ...(sourcePackage.openclaw || {}),
      manifest: "./openclaw.plugin.json",
      extensions: ["./index.js"] // 👈 强制修正数组内的路径
    }
  };

  // 修正 openclaw.plugin.json 中的路径
  const distManifest = {
    ...sourceManifest,
    main: "./index.js" // 👈 关键修复：不再是 ./dist/index.js
  };

  fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(distPackage, null, 2));
  fs.writeFileSync(path.join(distDir, "openclaw.plugin.json"), JSON.stringify(distManifest, null, 2));

  console.log(`\n🎉 组装成功！路径已对齐，语法已修复。`);
}

run().catch(e => { console.error("❌ 失败:", e.message); process.exit(1); });