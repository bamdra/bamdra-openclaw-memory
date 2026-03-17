import {
  createContextEngineMemoryV2Plugin,
  type ContextEngineMemoryV2Plugin,
} from "@openclaw-enhanced/bamdra-memory-context-engine";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import type {
  FactCategory,
  FactRecallPolicy,
  FactSensitivity,
  MemorySearchResult,
  MemoryV2Config,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const PLUGIN_ID = "bamdra-openclaw-memory";
const ENGINE_GLOBAL_KEY = "__OPENCLAW_BAMDRA_MEMORY_CONTEXT_ENGINE__";
const TOOLS_REGISTERED_KEY = Symbol.for("bamdra-openclaw-memory.tools-registered");
const ENGINE_REGISTERED_KEY = Symbol.for("bamdra-openclaw-memory.context-engine-registered");
const BOOTSTRAP_STARTED_KEY = Symbol.for("bamdra-openclaw-memory.host-bootstrap-started");
const SKILL_ID = "bamdra-memory-operator";
const REQUIRED_TOOL_NAMES = [
  "memory_list_topics",
  "memory_switch_topic",
  "memory_save_fact",
  "memory_compact_topic",
  "memory_search",
] as const;
const REQUIRED_PLUGIN_IDS = ["bamdra-user-bind"] as const;
const OPTIONAL_PLUGIN_IDS = ["bamdra-memory-vector"] as const;

function logUnifiedMemoryEvent(event: string, details: Record<string, unknown> = {}): void {
  try {
    console.info("[bamdra-openclaw-memory]", event, JSON.stringify(details));
  } catch {
    console.info("[bamdra-openclaw-memory]", event);
  }
}

type UnifiedPluginApi = {
  registerHook?: (
    events: string | string[],
    handler: (event: unknown) => unknown | Promise<unknown>,
    opts?: { name?: string; description?: string; priority?: number },
  ) => void;
  on?: (
    hookName: string,
    handler: (event: unknown, context: unknown) => unknown | Promise<unknown>,
    opts?: { priority?: number },
  ) => void;
  pluginConfig?: Partial<MemoryV2Config>;
  config?: Partial<MemoryV2Config>;
  plugin?: { config?: Partial<MemoryV2Config> };
  runtime?: {
    getContextEngine?(): ContextEngineMemoryV2Plugin | null | undefined;
    contextEngine?: unknown;
    config?: unknown;
  };
  contextEngine?: unknown;
  registerContextEngine: (
    id: string,
    factory: (config: MemoryV2Config) => ContextEngineMemoryV2Plugin | Promise<ContextEngineMemoryV2Plugin>,
  ) => void;
  registerTool?<TParams>(definition: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute(invocationId: string, params: TParams): Promise<{ content: { type: "text"; text: string }[] }>;
  }): void;
  [TOOLS_REGISTERED_KEY]?: boolean;
  [ENGINE_REGISTERED_KEY]?: boolean;
  [BOOTSTRAP_STARTED_KEY]?: boolean;
};

export function register(api: UnifiedPluginApi): void {
  initializeUnifiedPlugin(api, "register");
}

export async function activate(api: UnifiedPluginApi): Promise<void> {
  initializeUnifiedPlugin(api, "activate");
}

function initializeUnifiedPlugin(api: UnifiedPluginApi, phase: "register" | "activate"): void {
  logUnifiedMemoryEvent(`${phase}-plugin`, { id: PLUGIN_ID });

  if (!api[BOOTSTRAP_STARTED_KEY]) {
    api[BOOTSTRAP_STARTED_KEY] = true;
    queueMicrotask(() => {
      try {
        bootstrapOpenClawHost();
      } catch (error) {
        logUnifiedMemoryEvent("host-bootstrap-failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }

  const engine = brandContextEngine(createContextEngineMemoryV2Plugin(api.pluginConfig ?? api.config, api));
  exposeContextEngine(engine);
  engine.registerHooks(api);

  if (!api[TOOLS_REGISTERED_KEY] && typeof api.registerTool === "function") {
    registerUnifiedTools(api, engine);
    api[TOOLS_REGISTERED_KEY] = true;
    logUnifiedMemoryEvent("tools-ready", { id: PLUGIN_ID });
  }

  if (api[ENGINE_REGISTERED_KEY]) {
    return;
  }

  api.registerContextEngine(PLUGIN_ID, async (config) => {
    const configured = brandContextEngine(createContextEngineMemoryV2Plugin(config, api));
    exposeContextEngine(configured);
    configured.registerHooks(api);
    await configured.setup();
    logUnifiedMemoryEvent("context-engine-ready", {
      id: PLUGIN_ID,
      dbPath: configured.config.store.path,
    });
    return configured;
  });

  api[ENGINE_REGISTERED_KEY] = true;
}

function brandContextEngine(
  engine: ContextEngineMemoryV2Plugin,
): ContextEngineMemoryV2Plugin {
  engine.name = PLUGIN_ID;
  return engine;
}

function exposeContextEngine(engine: ContextEngineMemoryV2Plugin): void {
  (globalThis as Record<string, unknown>)[ENGINE_GLOBAL_KEY] = engine;
  process.env.OPENCLAW_BAMDRA_MEMORY_DB_PATH = engine.config.store.path;
}

interface ToolTextResult {
  content: { type: "text"; text: string }[];
}

interface MemoryListTopicsArgs {
  sessionId: string;
}

interface MemorySwitchTopicArgs {
  sessionId: string;
  topicId: string;
}

interface MemorySaveFactArgs {
  sessionId: string;
  key: string;
  value: string;
  category?: FactCategory;
  sensitivity?: FactSensitivity;
  recallPolicy?: FactRecallPolicy;
  scope?: string;
  topicId?: string | null;
  tags?: string[];
}

interface MemoryCompactTopicArgs {
  sessionId: string;
  topicId?: string | null;
}

interface MemorySearchArgs {
  sessionId: string;
  query: string;
  topicId?: string | null;
  limit?: number;
}

function registerUnifiedTools(api: UnifiedPluginApi, engine: ContextEngineMemoryV2Plugin): void {
  const definitions = [
    createToolDefinitions<MemoryListTopicsArgs>({
      name: "memory_list_topics",
      description: "List known topics for a session",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string" },
        },
      },
      async execute(params) {
        return engine.listTopics(params.sessionId);
      },
    }),
    createToolDefinitions<MemorySwitchTopicArgs>({
      name: "memory_switch_topic",
      description: "Switch the active topic for a session",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["sessionId", "topicId"],
        properties: {
          sessionId: { type: "string" },
          topicId: { type: "string" },
        },
      },
      async execute(params) {
        return engine.switchTopic(params.sessionId, params.topicId);
      },
    }),
    createToolDefinitions<MemorySaveFactArgs>({
      name: "memory_save_fact",
      description: "Persist a pinned memory fact for the current or selected topic",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["sessionId", "key", "value"],
        properties: {
          sessionId: { type: "string" },
          key: { type: "string" },
          value: { type: "string" },
          category: { type: "string" },
          sensitivity: { type: "string" },
          recallPolicy: { type: "string" },
          scope: { type: "string" },
          topicId: { type: ["string", "null"] },
          tags: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      async execute(params) {
        return engine.saveFact(params);
      },
    }),
    createToolDefinitions<MemoryCompactTopicArgs>({
      name: "memory_compact_topic",
      description: "Force refresh the summary for the current or selected topic",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string" },
          topicId: { type: ["string", "null"] },
        },
      },
      async execute(params) {
        return engine.compactTopic(params);
      },
    }),
    createToolDefinitions<MemorySearchArgs>({
      name: "memory_search",
      description: "Search topics and durable facts for a session",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["sessionId", "query"],
        properties: {
          sessionId: { type: "string" },
          query: { type: "string" },
          topicId: { type: ["string", "null"] },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
      },
      async execute(params) {
        return engine.searchMemory(params);
      },
    }),
  ];

  for (const group of definitions) {
    for (const definition of group) {
      api.registerTool?.(definition);
      logUnifiedMemoryEvent("tool-registered", { name: definition.name });
    }
  }
}

function createToolDefinitions<TParams>(definition: {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(params: TParams): Promise<unknown>;
}): Array<{
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(invocationId: string, params: TParams): Promise<ToolTextResult>;
}> {
  return [{
    name: definition.name,
    description: definition.description,
    parameters: definition.parameters,
    async execute(invocationId: string, params: TParams) {
      const result = await definition.execute(params);
      logUnifiedMemoryEvent("tool-execute", {
        name: definition.name,
        invocationId,
        sessionId:
          params && typeof params === "object" && "sessionId" in (params as Record<string, unknown>)
            ? (params as Record<string, unknown>).sessionId
            : null,
      });
      return asTextResult(result);
    },
  }];
}

function asTextResult(
  value: unknown,
): ToolTextResult {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function bootstrapOpenClawHost(): void {
  const openclawHome = resolve(homedir(), ".openclaw");
  const extensionRoot = join(openclawHome, "extensions");
  const pluginRuntimeRoot = resolve(dirname(__dirname));
  const configPath = join(openclawHome, "openclaw.json");
  const globalSkillsDir = join(openclawHome, "skills");
  const bundledSkillDir = join(resolve(dirname(__dirname)), "skills", SKILL_ID);
  const targetSkillDir = join(globalSkillsDir, SKILL_ID);
  const forceBootstrap = process.env.OPENCLAW_BAMDRA_MEMORY_FORCE_BOOTSTRAP === "1";

  if (!forceBootstrap && !pluginRuntimeRoot.startsWith(extensionRoot)) {
    logUnifiedMemoryEvent("host-bootstrap-skipped", {
      reason: "non-installed-runtime",
      pluginRuntimeRoot,
    });
    return;
  }

  if (!existsSync(configPath)) {
    logUnifiedMemoryEvent("host-bootstrap-skipped", { reason: "missing-openclaw-config" });
    return;
  }

  materializeBundledSkill(bundledSkillDir, targetSkillDir);

  const original = readFileSync(configPath, "utf8");
  const config = JSON.parse(original) as Record<string, unknown>;
  const changed = ensureHostConfig(config, targetSkillDir);

  if (!changed) {
    logUnifiedMemoryEvent("host-bootstrap-noop", { configPath });
    return;
  }

  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  logUnifiedMemoryEvent("host-bootstrap-updated", {
    configPath,
    targetSkillDir,
    pluginId: PLUGIN_ID,
  });
}

function materializeBundledSkill(sourceDir: string, targetDir: string): void {
  if (!existsSync(sourceDir)) {
    logUnifiedMemoryEvent("skill-copy-skipped", {
      reason: "missing-bundled-skill",
      sourceDir,
    });
    return;
  }

  if (existsSync(targetDir)) {
    logUnifiedMemoryEvent("skill-copy-skipped", {
      reason: "target-exists",
      targetDir,
    });
    return;
  }

  mkdirSync(dirname(targetDir), { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
  logUnifiedMemoryEvent("skill-copied", { sourceDir, targetDir });
}

function ensureHostConfig(
  config: Record<string, unknown>,
  targetSkillDir: string,
): boolean {
  let changed = false;

  const plugins = ensureObject(config, "plugins");
  const tools = ensureObject(config, "tools");
  const skills = ensureObject(config, "skills");
  const skillsLoad = ensureObject(skills, "load");
  const agents = ensureObject(config, "agents");
  const entries = ensureObject(plugins, "entries");
  const installs = ensureObject(plugins, "installs");
  const load = ensureObject(plugins, "load");
  const slots = ensureObject(plugins, "slots");
  const pluginEntry = ensureObject(entries, PLUGIN_ID);
  const userBindEntry = ensureObject(entries, REQUIRED_PLUGIN_IDS[0]);
  const pluginConfig = ensureObject(pluginEntry, "config");
  const pluginStore = ensureObject(pluginConfig, "store");
  const pluginCache = ensureObject(pluginConfig, "cache");

  changed = ensureArrayIncludes(plugins, "allow", PLUGIN_ID) || changed;
  for (const dependencyId of REQUIRED_PLUGIN_IDS) {
    changed = ensureArrayIncludes(plugins, "allow", dependencyId) || changed;
    const dependencyEntry = dependencyId === REQUIRED_PLUGIN_IDS[0] ? userBindEntry : ensureObject(entries, dependencyId);
    if (dependencyEntry.enabled !== true) {
      dependencyEntry.enabled = true;
      changed = true;
    }
  }
  for (const optionalId of OPTIONAL_PLUGIN_IDS) {
    if (optionalId in entries) {
      changed = ensureArrayIncludes(plugins, "allow", optionalId) || changed;
    }
  }
  changed = ensureArrayIncludes(plugins, "deny", "memory-core") || changed;
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
  if (typeof userBindEntry.config !== "object" || userBindEntry.config == null) {
    userBindEntry.config = {
      enabled: true,
      adminAgents: [],
    };
    changed = true;
  }

  if (PLUGIN_ID in installs) {
    // Keep installer metadata untouched.
  }

  changed = ensureToolAllowlist(tools) || changed;
  changed = ensureAgentSkills(agents, SKILL_ID) || changed;

  if (!existsSync(targetSkillDir)) {
    logUnifiedMemoryEvent("host-bootstrap-skill-pending", { targetSkillDir });
  }

  return changed;
}

function ensureToolAllowlist(tools: Record<string, unknown>): boolean {
  let changed = false;
  for (const toolName of REQUIRED_TOOL_NAMES) {
    changed = ensureArrayIncludes(tools, "allow", toolName) || changed;
  }
  return changed;
}

function ensureAgentSkills(agents: Record<string, unknown>, skillId: string): boolean {
  const list = Array.isArray(agents.list) ? agents.list : [];
  let changed = false;

  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const agent = item as Record<string, unknown>;
    const currentSkills = Array.isArray(agent.skills)
      ? [...(agent.skills as string[])]
      : [];
    if (!Array.isArray(agent.skills)) {
      agent.skills = currentSkills;
      changed = true;
    }
    if (!currentSkills.includes(skillId)) {
      currentSkills.push(skillId);
      agent.skills = currentSkills;
      changed = true;
    }
  }

  return changed;
}

function ensureObject(
  parent: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const current = parent[key];
  if (current && typeof current === "object" && !Array.isArray(current)) {
    return current as Record<string, unknown>;
  }
  const next: Record<string, unknown> = {};
  parent[key] = next;
  return next;
}

function ensureArrayIncludes(
  parent: Record<string, unknown>,
  key: string,
  value: string,
): boolean {
  const current = Array.isArray(parent[key]) ? [...(parent[key] as string[])] : [];
  if (current.includes(value)) {
    if (!Array.isArray(parent[key])) {
      parent[key] = current;
    }
    return false;
  }
  current.push(value);
  parent[key] = current;
  return true;
}
