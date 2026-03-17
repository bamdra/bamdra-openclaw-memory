import type {
  FactCategory,
  FactRecallPolicy,
  FactSensitivity,
  MemorySearchResult,
  MemoryV2Config,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";
import {
  createContextEngineMemoryV2Plugin,
  type ContextEngineMemoryV2Plugin,
} from "@openclaw-enhanced/bamdra-memory-context-engine";
import { homedir } from "node:os";
import { join } from "node:path";

const ENGINE_GLOBAL_KEY = "__OPENCLAW_BAMDRA_MEMORY_CONTEXT_ENGINE__";
const DEFAULT_DB_PATH = join(
  homedir(),
  ".openclaw",
  "memory",
  process.env.OPENCLAW_BAMDRA_MEMORY_DB_BASENAME || "main.sqlite",
);

function logMemoryToolEvent(event: string, details: Record<string, unknown> = {}): void {
  try {
    console.info("[bamdra-openclaw-memory-tools]", event, JSON.stringify(details));
  } catch {
    console.info("[bamdra-openclaw-memory-tools]", event);
  }
}

export interface MemoryListTopicsArgs {
  sessionId: string;
}

export interface MemorySwitchTopicArgs {
  sessionId: string;
  topicId: string;
}

export interface MemorySaveFactArgs {
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

export interface MemoryCompactTopicArgs {
  sessionId: string;
  topicId?: string | null;
}

export interface MemorySearchArgs {
  sessionId: string;
  query: string;
  topicId?: string | null;
  limit?: number;
}

export interface ToolsMemoryV2Plugin {
  name: string;
  tools: {
    memory_list_topics(args: MemoryListTopicsArgs): Promise<
      Array<
        TopicRecord & {
          isActive: boolean;
        }
      >
    >;
    memory_switch_topic(args: MemorySwitchTopicArgs): Promise<TopicRecord>;
    memory_save_fact(args: MemorySaveFactArgs): Promise<{
      topicId: string | null;
      tags: string[];
    }>;
    memory_compact_topic(args: MemoryCompactTopicArgs): Promise<TopicRecord>;
    memory_search(args: MemorySearchArgs): Promise<MemorySearchResult>;
  };
}

interface ToolTextResult {
  content: { type: "text"; text: string }[];
}

interface ToolDefinition<TParams> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(invocationId: string, params: TParams): Promise<ToolTextResult>;
}

interface ToolsRuntimeLike {
  getContextEngine?(): ContextEngineMemoryV2Plugin | null | undefined;
  contextEngine?: unknown;
  config?: unknown;
}

interface ToolsPluginHost {
  runtime?: ToolsRuntimeLike;
  contextEngine?: unknown;
  config?: unknown;
  plugin?: { config?: unknown };
  registerTool<TParams>(definition: ToolDefinition<TParams>): void;
}

let standaloneEnginePromise: Promise<ContextEngineMemoryV2Plugin> | null = null;

export function createToolsMemoryV2Plugin(
  contextEngine: ContextEngineMemoryV2Plugin,
): ToolsMemoryV2Plugin {
  return {
    name: "bamdra-memory-tools",
    tools: {
      async memory_list_topics(args: MemoryListTopicsArgs) {
        return contextEngine.listTopics(args.sessionId);
      },
      async memory_switch_topic(args: MemorySwitchTopicArgs) {
        return contextEngine.switchTopic(args.sessionId, args.topicId);
      },
      async memory_save_fact(args: MemorySaveFactArgs) {
        return contextEngine.saveFact(args);
      },
      async memory_compact_topic(args: MemoryCompactTopicArgs) {
        return contextEngine.compactTopic(args);
      },
      async memory_search(args: MemorySearchArgs) {
        return contextEngine.searchMemory(args);
      },
    },
  };
}

export function register(api: {
  runtime?: ToolsRuntimeLike;
  contextEngine?: unknown;
  config?: unknown;
  plugin?: { config?: unknown };
  registerTool<TParams>(definition: ToolDefinition<TParams>): void;
}): void {
  logMemoryToolEvent("register-tools");
  registerMemoryTools(api);
}

export async function activate(api: {
  runtime?: ToolsRuntimeLike;
  contextEngine?: unknown;
  config?: unknown;
  plugin?: { config?: unknown };
  registerTool<TParams>(definition: ToolDefinition<TParams>): void;
}): Promise<void> {
  logMemoryToolEvent("activate-tools");
  registerMemoryTools(api);
}

export function registerMemoryTools(api: ToolsPluginHost): void {
  function asTextResult(value: unknown): ToolTextResult {
    return {
      content: [
        {
          type: "text",
          text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
        },
      ],
    };
  }

  const definitions: Array<Array<ToolDefinition<unknown>>> = [
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
      async execute(engine, params) {
        return engine.listTopics(params.sessionId);
      },
    }, api, asTextResult),
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
      async execute(engine, params) {
        return engine.switchTopic(params.sessionId, params.topicId);
      },
    }, api, asTextResult),
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
      async execute(engine, params) {
        return engine.saveFact(params);
      },
    }, api, asTextResult),
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
      async execute(engine, params) {
        return engine.compactTopic(params);
      },
    }, api, asTextResult),
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
      async execute(engine, params) {
        return engine.searchMemory(params);
      },
    }, api, asTextResult),
  ];

  for (const toolGroup of definitions) {
    for (const definition of toolGroup) {
      api.registerTool(definition);
      logMemoryToolEvent("tool-registered", { name: definition.name });
    }
  }
}

function createToolDefinitions<TParams>(
  definition: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute(
      engine: ContextEngineMemoryV2Plugin,
      params: TParams,
    ): Promise<unknown>;
  },
  api: ToolsPluginHost,
  asTextResult: (value: unknown) => ToolTextResult,
): ToolDefinition<TParams>[] {
  return [{
    name: definition.name,
    description: definition.description,
    parameters: definition.parameters,
    async execute(invocationId: string, params: TParams) {
      const engine = await resolveContextEngine(api);
      logMemoryToolEvent("tool-execute", {
        name: definition.name,
        invocationId,
        sessionId:
          params && typeof params === "object" && "sessionId" in (params as Record<string, unknown>)
            ? (params as Record<string, unknown>).sessionId
            : null,
      });
      const result = await definition.execute(engine, params);
      return asTextResult(result);
    },
  }];
}

async function resolveContextEngine(
  api: ToolsPluginHost,
): Promise<ContextEngineMemoryV2Plugin> {
  const existingEngine = getExistingContextEngine(api);
  if (existingEngine) {
    logMemoryToolEvent("resolve-context-engine", { source: "runtime" });
    return existingEngine;
  }

  if (!standaloneEnginePromise) {
    const config = resolveMemoryConfig(api);
    const engine = createContextEngineMemoryV2Plugin(config);
    logMemoryToolEvent("resolve-context-engine", {
      source: "standalone-bootstrap",
      dbPath: config.store.path,
    });
    standaloneEnginePromise = engine
      .setup()
      .then(() => {
        exposeContextEngine(engine);
        return engine;
      })
      .catch((error: unknown) => {
        standaloneEnginePromise = null;
        throw error;
      });
  }

  return standaloneEnginePromise;
}

function getExistingContextEngine(
  api: ToolsPluginHost,
): ContextEngineMemoryV2Plugin | null {
  const candidates = [
    api.runtime?.getContextEngine?.(),
    api.runtime?.contextEngine,
    api.contextEngine,
    (globalThis as Record<string, unknown>)[ENGINE_GLOBAL_KEY],
  ];

  for (const candidate of candidates) {
    if (isContextEngine(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveMemoryConfig(api: ToolsPluginHost): MemoryV2Config {
  const config = mergeMemoryConfig(
    defaultMemoryConfig(),
    extractConfigCandidate(getExistingContextEngine(api)?.config),
    extractConfigCandidate(api.runtime?.config),
    extractConfigCandidate(api.contextEngine),
    extractConfigCandidate(api.plugin?.config),
    extractConfigCandidate(api.config),
  );

  return config;
}

function extractConfigCandidate(value: unknown): Partial<MemoryV2Config> | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<MemoryV2Config> & { config?: Partial<MemoryV2Config> };
  if (candidate.store?.path || candidate.cache?.provider || candidate.enabled != null) {
    return candidate;
  }

  if (candidate.config && typeof candidate.config === "object") {
    return candidate.config;
  }

  return null;
}

function mergeMemoryConfig(
  ...configs: Array<Partial<MemoryV2Config> | null>
): MemoryV2Config {
  const merged = defaultMemoryConfig();

  for (const config of configs) {
    if (!config) {
      continue;
    }

    if (typeof config.enabled === "boolean") {
      merged.enabled = config.enabled;
    }
    if (config.store?.path) {
      merged.store.path = config.store.path;
    }
    if (config.cache) {
      merged.cache = {
        ...merged.cache,
        ...config.cache,
      };
    }
    if (config.topicRouting) {
      merged.topicRouting = {
        ...merged.topicRouting,
        ...config.topicRouting,
      };
    }
    if (config.contextAssembly) {
      merged.contextAssembly = {
        ...merged.contextAssembly,
        ...config.contextAssembly,
      };
    }
  }

  return merged;
}

function defaultMemoryConfig(): MemoryV2Config {
  return {
    enabled: true,
    store: {
      provider: "sqlite",
      path:
        process.env.OPENCLAW_BAMDRA_MEMORY_DB_PATH ||
        process.env.OPENCLAW_MEMORY_DB_PATH ||
        DEFAULT_DB_PATH,
    },
    cache: {
      provider: "memory",
      maxSessions: 128,
      maxTopicsPerSession: 64,
      maxFacts: 2048,
    },
    topicRouting: {
      maxRecentTopics: 12,
      newTopicThreshold: 0.28,
      switchTopicThreshold: 0.55,
    },
    contextAssembly: {
      recentTurns: 6,
      includeTopicShortSummary: true,
      includeOpenLoops: true,
      alwaysFactLimit: 12,
      topicFactLimit: 16,
    },
  };
}

function isContextEngine(value: unknown): value is ContextEngineMemoryV2Plugin {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ContextEngineMemoryV2Plugin>;
  return (
    typeof candidate.listTopics === "function" &&
    typeof candidate.switchTopic === "function" &&
    typeof candidate.saveFact === "function" &&
    typeof candidate.compactTopic === "function" &&
    typeof candidate.searchMemory === "function"
  );
}

function exposeContextEngine(engine: ContextEngineMemoryV2Plugin): void {
  (globalThis as Record<string, unknown>)[ENGINE_GLOBAL_KEY] = engine;
  process.env.OPENCLAW_BAMDRA_MEMORY_DB_PATH = engine.config.store.path;
}
