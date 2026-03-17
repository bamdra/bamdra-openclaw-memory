import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const configDir = fileURLToPath(new URL(".", import.meta.url));
const workspaceAliases = {
  "@openclaw-enhanced/bamdra-memory-context-engine": resolve(
    configDir,
    "../bamdra-memory-context-engine/src/index.ts",
  ),
};

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  clean: false,
  bundle: true,
  shims: true,
  target: "node22",
  splitting: false,
  noExternal: [/.*/],
  external: [
    "node:sqlite",
    "node:fs",
    "node:path",
    "node:url",
    "node:events",
    "node:fs/promises",
    "node:crypto",
    "node:os",
  ],
  outExtension() {
    return { js: ".js" };
  },
  esbuildOptions(options) {
    options.platform = "node";
    options.target = "node22";
    options.alias = {
      ...(options.alias ?? {}),
      ...workspaceAliases,
    };
  },
});
