import fs from "node:fs";
import path from "node:path";

const pluginName = process.argv[2];
const distDir = path.resolve("dist");
const projectRoot = path.resolve("../../..");
const sqlSource = path.resolve(projectRoot, "packages/memory-sqlite/src/schema.sql");

async function run() {
  if (!pluginName) throw new Error("Usage: node ... <plugin-name>");

  console.log(`Preparing ${pluginName} distribution...`);

  const pluginRoot = process.cwd();
  const indexPath = path.join(distDir, "index.js");

  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
  if (fs.existsSync(sqlSource)) fs.copyFileSync(sqlSource, path.join(distDir, "schema.sql"));

  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, "utf8");
    const builtins = ["sqlite", "fs", "path", "url", "promises", "events", "fs/promises"];

    builtins.forEach((mod) => {
      const regex = new RegExp(`require\\(["']${mod}["']\\)`, "g");
      content = content.replace(regex, `require("node:${mod}")`);
    });

    const exportRegex = /0\s*&&\s*\(module\.exports\s*=\s*\{([\s\S]*?)\}\);/m;
    if (exportRegex.test(content)) {
      content = content.replace(exportRegex, (_match, exports) => {
        return `module.exports = {${exports.trim()}};`;
      });
    } else if (!content.includes("module.exports =")) {
      content += "\n\nmodule.exports = { activate, register, createContextEngineMemoryV2Plugin };\n";
    }

    fs.writeFileSync(indexPath, content);
  }

  const sourcePackage = JSON.parse(fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"));
  const sourceManifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, "openclaw.plugin.json"), "utf8"));

  const distPackage = {
    ...sourcePackage,
    type: "commonjs",
    main: "./index.js",
    openclaw: {
      ...(sourcePackage.openclaw || {}),
      manifest: "./openclaw.plugin.json",
      extensions: ["./index.js"],
    },
  };

  const distManifest = {
    ...sourceManifest,
    main: "./index.js",
  };

  fs.writeFileSync(path.join(distDir, "package.json"), JSON.stringify(distPackage, null, 2));
  fs.writeFileSync(path.join(distDir, "openclaw.plugin.json"), JSON.stringify(distManifest, null, 2));
}

run().catch((error) => {
  console.error("Failed to prepare plugin dist:", error.message);
  process.exit(1);
});
