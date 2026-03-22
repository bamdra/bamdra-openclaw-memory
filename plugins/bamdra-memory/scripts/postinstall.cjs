"use strict";

const { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { homedir } = require("node:os");
const { dirname, join, resolve, sep } = require("node:path");
const { createRequire } = require("node:module");

const PLUGIN_ID = "bamdra-openclaw-memory";
const SKILL_ID = "bamdra-memory-operator";
const UPGRADE_SKILL_ID = "bamdra-memory-upgrade-operator";
const USER_BIND_PROFILE_SKILL_ID = "bamdra-user-bind-profile";
const USER_BIND_ADMIN_SKILL_ID = "bamdra-user-bind-admin";
const VECTOR_SKILL_ID = "bamdra-memory-vector-operator";
const REQUIRED_TOOL_NAMES = [
  "bamdra_memory_list_topics",
  "bamdra_memory_switch_topic",
  "bamdra_memory_save_fact",
  "bamdra_memory_compact_topic",
  "bamdra_memory_search",
  "bamdra_user_bind_get_my_profile",
  "bamdra_user_bind_update_my_profile",
  "bamdra_user_bind_refresh_my_binding",
  "bamdra_user_bind_admin_query",
  "bamdra_user_bind_admin_edit",
  "bamdra_user_bind_admin_merge",
  "bamdra_user_bind_admin_list_issues",
  "bamdra_user_bind_admin_sync",
  "bamdra_memory_vector_search",
] ;
const LEGACY_TOOL_ALIASES = [
  "memory_list_topics",
  "memory_switch_topic",
  "memory_save_fact",
  "memory_compact_topic",
  "memory_search",
  "user_bind_get_my_profile",
  "user_bind_update_my_profile",
  "user_bind_refresh_my_binding",
  "user_bind_admin_query",
  "user_bind_admin_edit",
  "user_bind_admin_merge",
  "user_bind_admin_list_issues",
  "user_bind_admin_sync",
  "memory_vector_search",
];
const REQUIRED_PLUGIN_IDS = ["bamdra-user-bind"];
const OPTIONAL_PLUGIN_IDS = ["bamdra-memory-vector"];
const AUTO_PROVISION_PLUGIN_IDS = [...REQUIRED_PLUGIN_IDS, ...OPTIONAL_PLUGIN_IDS];
const CONFLICTING_PLUGIN_IDS = ["memory-core", "memory-lancedb"];
const runtimeRequire = createRequire(__filename);

function log(event, details) {
  try {
    console.info("[bamdra-openclaw-memory:postinstall]", event, JSON.stringify(details || {}));
  } catch {
    console.info("[bamdra-openclaw-memory:postinstall]", event);
  }
}

function ensureObject(parent, key) {
  if (!parent[key] || typeof parent[key] !== "object" || Array.isArray(parent[key])) {
    parent[key] = {};
  }
  return parent[key];
}

function ensureArrayIncludes(parent, key, value) {
  const current = Array.isArray(parent[key]) ? [...parent[key]] : [];
  if (current.includes(value)) {
    if (!Array.isArray(parent[key])) {
      parent[key] = current;
      return true;
    }
    return false;
  }
  current.push(value);
  parent[key] = current;
  return true;
}

function dependencySkillIds(pluginId) {
  if (pluginId === "bamdra-user-bind") return [USER_BIND_PROFILE_SKILL_ID, USER_BIND_ADMIN_SKILL_ID];
  if (pluginId === "bamdra-memory-vector") return [VECTOR_SKILL_ID];
  return [];
}

function materializeBundledSkill(sourceDir, targetDir) {
  if (!existsSync(sourceDir) || existsSync(targetDir)) return;
  mkdirSync(dirname(targetDir), { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

function resolveBundledDependencySource(pluginId) {
  const packageNameByPluginId = {
    "bamdra-user-bind": "@bamdra/bamdra-user-bind",
    "bamdra-memory-vector": "@bamdra/bamdra-memory-vector",
  };
  const packageName = packageNameByPluginId[pluginId];
  const candidateRoots = [];

  if (packageName) {
    try {
      const entryPath = runtimeRequire.resolve(packageName);
      candidateRoots.push(dirname(dirname(entryPath)));
      candidateRoots.push(dirname(entryPath));
    } catch {
      // Ignore and continue.
    }
  }

  candidateRoots.push(resolve(__dirname, "..", "bundled-plugins", pluginId));
  candidateRoots.push(resolve(__dirname, "..", "..", "..", pluginId));
  candidateRoots.push(resolve(__dirname, "..", "..", "..", "..", pluginId));

  for (const root of candidateRoots) {
    const distDir = existsSync(join(root, "dist")) ? join(root, "dist") : root;
    if (
      existsSync(join(distDir, "index.js")) &&
      existsSync(join(distDir, "openclaw.plugin.json")) &&
      existsSync(join(distDir, "package.json"))
    ) {
      return distDir;
    }
  }

  return null;
}

function materializeBundledDependencyPlugins(extensionRoot) {
  for (const pluginId of AUTO_PROVISION_PLUGIN_IDS) {
    const targetDir = join(extensionRoot, pluginId);
    if (existsSync(targetDir)) continue;
    const sourceDir = resolveBundledDependencySource(pluginId);
    if (!sourceDir) {
      log("dependency-plugin-copy-skipped", { pluginId, reason: "source-not-found" });
      continue;
    }
    mkdirSync(dirname(targetDir), { recursive: true });
    cpSync(sourceDir, targetDir, { recursive: true });
    log("dependency-plugin-copied", { pluginId, sourceDir, targetDir });
  }
}

function materializeBundledDependencySkills(globalSkillsDir) {
  for (const pluginId of AUTO_PROVISION_PLUGIN_IDS) {
    const sourceDir = resolveBundledDependencySource(pluginId);
    if (!sourceDir) continue;
    const packageRoot = sourceDir.endsWith(`${sep}dist`) ? dirname(sourceDir) : sourceDir;
    const skillsRoot = join(packageRoot, "skills");
    if (!existsSync(skillsRoot)) continue;
    for (const skillId of dependencySkillIds(pluginId)) {
      materializeBundledSkill(join(skillsRoot, skillId), join(globalSkillsDir, skillId));
    }
  }
}

function ensureToolAllowlist(tools) {
  let changed = false;
  const allow = Array.isArray(tools.allow) ? [...tools.allow] : [];
  const filteredAllow = allow.filter((toolName) => !LEGACY_TOOL_ALIASES.includes(toolName));
  if (!Array.isArray(tools.allow) || filteredAllow.length !== allow.length) {
    tools.allow = filteredAllow;
    changed = true;
  }
  for (const toolName of REQUIRED_TOOL_NAMES) {
    changed = ensureArrayIncludes(tools, "allow", toolName) || changed;
  }
  return changed;
}

function ensureAgentSkills(agents, skillId) {
  let changed = false;
  for (const item of iterAgentConfigs(agents)) {
    if (!item || typeof item !== "object") continue;
    const currentSkills = Array.isArray(item.skills) ? [...item.skills] : [];
    if (!Array.isArray(item.skills)) {
      item.skills = currentSkills;
      changed = true;
    }
    if (!currentSkills.includes(skillId)) {
      currentSkills.push(skillId);
      item.skills = currentSkills;
      changed = true;
    }
  }
  return changed;
}

function ensureAdminSkills(agents, skillId, adminAgentIds) {
  let changed = false;
  for (const item of iterAgentConfigs(agents)) {
    if (!item || typeof item !== "object") continue;
    const agentId = typeof item.id === "string" ? item.id : typeof item.name === "string" ? item.name : null;
    if (!agentId || !adminAgentIds.includes(agentId)) continue;
    const currentSkills = Array.isArray(item.skills) ? [...item.skills] : [];
    if (!Array.isArray(item.skills)) {
      item.skills = currentSkills;
      changed = true;
    }
    if (!currentSkills.includes(skillId)) {
      currentSkills.push(skillId);
      item.skills = currentSkills;
      changed = true;
    }
  }
  return changed;
}

function* iterAgentConfigs(agents) {
  const seen = new Set();
  const list = Array.isArray(agents.list) ? agents.list : [];
  for (const item of list) {
    if (item && typeof item === "object") {
      seen.add(item);
      yield item;
    }
  }
  if (list.length > 0) return;
  for (const [key, value] of Object.entries(agents)) {
    if (key === "list" || key === "defaults" || !value || typeof value !== "object" || Array.isArray(value)) continue;
    if (seen.has(value)) continue;
    if (typeof value.id !== "string" && typeof value.name !== "string") {
      value.id = key;
    }
    seen.add(value);
    yield value;
  }
}

function ensureHostConfig(config) {
  let changed = false;

  const plugins = ensureObject(config, "plugins");
  const tools = ensureObject(config, "tools");
  const skills = ensureObject(config, "skills");
  const skillsLoad = ensureObject(skills, "load");
  const agents = ensureObject(config, "agents");
  const entries = ensureObject(plugins, "entries");
  const load = ensureObject(plugins, "load");
  const slots = ensureObject(plugins, "slots");
  const pluginEntry = ensureObject(entries, PLUGIN_ID);
  const userBindEntry = ensureObject(entries, REQUIRED_PLUGIN_IDS[0]);
  const vectorEntry = ensureObject(entries, OPTIONAL_PLUGIN_IDS[0]);
  const conflictingEntries = CONFLICTING_PLUGIN_IDS.map((pluginId) => ensureObject(entries, pluginId));
  const pluginConfig = ensureObject(pluginEntry, "config");
  const pluginStore = ensureObject(pluginConfig, "store");
  const pluginCache = ensureObject(pluginConfig, "cache");

  if (plugins.enabled !== true) {
    plugins.enabled = true;
    changed = true;
  }
  changed = ensureArrayIncludes(plugins, "allow", PLUGIN_ID) || changed;
  for (const dependencyId of REQUIRED_PLUGIN_IDS) {
    changed = ensureArrayIncludes(plugins, "allow", dependencyId) || changed;
    const dependencyEntry = ensureObject(entries, dependencyId);
    if (dependencyEntry.enabled !== true) {
      dependencyEntry.enabled = true;
      changed = true;
    }
  }
  for (const optionalId of OPTIONAL_PLUGIN_IDS) {
    changed = ensureArrayIncludes(plugins, "allow", optionalId) || changed;
  }
  for (const conflictingId of CONFLICTING_PLUGIN_IDS) {
    changed = ensureArrayIncludes(plugins, "deny", conflictingId) || changed;
  }
  changed = ensureArrayIncludes(load, "paths", join(homedir(), ".openclaw", "extensions")) || changed;
  changed = ensureArrayIncludes(skillsLoad, "extraDirs", join(homedir(), ".openclaw", "skills")) || changed;

  if (slots.memory !== PLUGIN_ID) {
    slots.memory = PLUGIN_ID;
    changed = true;
  }
  if (slots.contextEngine !== PLUGIN_ID) {
    slots.contextEngine = PLUGIN_ID;
    changed = true;
  }
  if (pluginEntry.enabled !== true) {
    pluginEntry.enabled = true;
    changed = true;
  }
  if (pluginConfig.enabled !== true) {
    pluginConfig.enabled = true;
    changed = true;
  }
  if (pluginStore.provider !== "sqlite") {
    pluginStore.provider = "sqlite";
    changed = true;
  }
  if (typeof pluginStore.path !== "string" || pluginStore.path.length === 0) {
    pluginStore.path = "~/.openclaw/memory/main.sqlite";
    changed = true;
  }
  if (pluginCache.provider !== "memory") {
    pluginCache.provider = "memory";
    changed = true;
  }
  if (typeof pluginCache.maxSessions !== "number") {
    pluginCache.maxSessions = 128;
    changed = true;
  }

  const userBindConfig = ensureObject(userBindEntry, "config");
  if (userBindEntry.enabled !== true) {
    userBindEntry.enabled = true;
    changed = true;
  }
  if (userBindConfig.enabled !== true) {
    userBindConfig.enabled = true;
    changed = true;
  }
  if (typeof userBindConfig.localStorePath !== "string" || userBindConfig.localStorePath.length === 0) {
    userBindConfig.localStorePath = "~/.openclaw/data/bamdra-user-bind";
    changed = true;
  }
  if (typeof userBindConfig.exportPath !== "string" || userBindConfig.exportPath.length === 0) {
    userBindConfig.exportPath = "~/.openclaw/data/bamdra-user-bind/exports";
    changed = true;
  }
  if (typeof userBindConfig.profileMarkdownRoot !== "string" || userBindConfig.profileMarkdownRoot.length === 0) {
    userBindConfig.profileMarkdownRoot = "~/.openclaw/data/bamdra-user-bind/profiles/private";
    changed = true;
  }
  if (typeof userBindConfig.cacheTtlMs !== "number") {
    userBindConfig.cacheTtlMs = 1800000;
    changed = true;
  }
  if (!Array.isArray(userBindConfig.adminAgents) || userBindConfig.adminAgents.length === 0) {
    userBindConfig.adminAgents = ["main"];
    changed = true;
  }

  const vectorConfig = ensureObject(vectorEntry, "config");
  if (vectorEntry.enabled !== true) {
    vectorEntry.enabled = true;
    changed = true;
  }
  if (vectorConfig.enabled !== true) {
    vectorConfig.enabled = true;
    changed = true;
  }
  if (typeof vectorConfig.markdownRoot !== "string" || vectorConfig.markdownRoot.length === 0) {
    vectorConfig.markdownRoot = "~/.openclaw/memory/vector/markdown";
    changed = true;
  }
  if (typeof vectorConfig.privateMarkdownRoot !== "string" || vectorConfig.privateMarkdownRoot.length === 0) {
    vectorConfig.privateMarkdownRoot = "~/.openclaw/memory/vector/markdown/private";
    changed = true;
  }
  if (typeof vectorConfig.sharedMarkdownRoot !== "string" || vectorConfig.sharedMarkdownRoot.length === 0) {
    vectorConfig.sharedMarkdownRoot = "~/.openclaw/memory/vector/markdown/shared";
    changed = true;
  }
  if (typeof vectorConfig.indexPath !== "string" || vectorConfig.indexPath.length === 0) {
    vectorConfig.indexPath = "~/.openclaw/memory/vector/index.json";
    changed = true;
  }
  if (typeof vectorConfig.dimensions !== "number") {
    vectorConfig.dimensions = 64;
    changed = true;
  }
  if (typeof vectorConfig.topK !== "number") {
    vectorConfig.topK = 5;
    changed = true;
  }

  for (const conflictingEntry of conflictingEntries) {
    if (conflictingEntry.enabled !== false) {
      conflictingEntry.enabled = false;
      changed = true;
    }
  }

  changed = ensureToolAllowlist(tools) || changed;
  changed = ensureAgentSkills(agents, SKILL_ID) || changed;
  changed = ensureAgentSkills(agents, USER_BIND_PROFILE_SKILL_ID) || changed;
  changed = ensureAgentSkills(agents, VECTOR_SKILL_ID) || changed;
  changed = ensureAdminSkills(agents, USER_BIND_ADMIN_SKILL_ID, ["main"]) || changed;

  return changed;
}

function main() {
  const openclawHome = resolve(homedir(), ".openclaw");
  const extensionRoot = join(openclawHome, "extensions");
  const memoryRoot = join(openclawHome, "memory");
  const globalSkillsDir = join(openclawHome, "skills");
  const bundledSkills = [
    { sourceDir: join(resolve(__dirname, "..", "skills", SKILL_ID)), targetDir: join(globalSkillsDir, SKILL_ID) },
    { sourceDir: join(resolve(__dirname, "..", "skills", UPGRADE_SKILL_ID)), targetDir: join(globalSkillsDir, UPGRADE_SKILL_ID) },
  ];
  const configPath = join(openclawHome, "openclaw.json");

  if (!existsSync(configPath)) {
    log("bootstrap-skipped", { reason: "missing-openclaw-config" });
    return;
  }

  mkdirSync(openclawHome, { recursive: true });
  mkdirSync(extensionRoot, { recursive: true });
  mkdirSync(memoryRoot, { recursive: true });

  materializeBundledDependencyPlugins(extensionRoot);
  for (const skill of bundledSkills) {
    materializeBundledSkill(skill.sourceDir, skill.targetDir);
  }
  materializeBundledDependencySkills(globalSkillsDir);

  const original = readFileSync(configPath, "utf8");
  const config = JSON.parse(original);
  const changed = ensureHostConfig(config);

  if (!changed) {
    log("bootstrap-noop", { configPath });
    return;
  }

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  log("bootstrap-updated", { configPath, pluginId: PLUGIN_ID });
}

try {
  main();
} catch (error) {
  log("bootstrap-failed", { message: error instanceof Error ? error.message : String(error) });
}
