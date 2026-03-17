import type {
  FactCategory,
  FactRecallPolicy,
  FactSensitivity,
  MemorySearchResult,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";
import type { ContextEngineMemoryV2Plugin } from "@openclaw-enhanced/bamdra-memory-context-engine";

interface ToolTextContent {
  type: "text";
  text: string;
}

interface ToolExecutionResult {
  content: ToolTextContent[];
}

interface MemoryListTopicsParams {
  sessionId: string;
}

interface MemorySwitchTopicParams {
  sessionId: string;
  topicId: string;
}

interface MemorySaveFactParams {
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

interface MemoryCompactTopicParams {
  sessionId: string;
  topicId?: string | null;
}

interface MemorySearchParams {
  sessionId: string;
  query: string;
  topicId?: string | null;
  limit?: number;
}

interface ToolDefinition<TParams> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(invocationId: string, params: TParams): Promise<ToolExecutionResult>;
}

interface ToolsPluginHost {
  runtime?: {
    getContextEngine?(): ContextEngineMemoryV2Plugin | null | undefined;
  };
  registerTool<TParams>(definition: ToolDefinition<TParams>): void;
}

function asTextResult(
  value:
    | TopicRecord
    | Array<TopicRecord & { isActive: boolean }>
    | MemorySearchResult
    | { topicId: string | null; tags: string[] }
    | string,
): ToolExecutionResult {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

export default function registerToolsMemoryV2(api: ToolsPluginHost): void {
  api.registerTool({
    name: "memory_list_topics",
    description: "List known topics for a session",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["sessionId"],
      properties: {
        sessionId: { type: "string" }
      }
    },
    async execute(_invocationId: string, params: MemoryListTopicsParams) {
      const engine = api.runtime?.getContextEngine?.();
      if (!engine?.listTopics) {
        return asTextResult("memory-v2 context engine is not active");
      }
      const topics = await engine.listTopics(params.sessionId);
      return asTextResult(topics);
    }
  });

  api.registerTool({
    name: "memory_switch_topic",
    description: "Switch the active topic for a session",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["sessionId", "topicId"],
      properties: {
        sessionId: { type: "string" },
        topicId: { type: "string" }
      }
    },
    async execute(_invocationId: string, params: MemorySwitchTopicParams) {
      const engine = api.runtime?.getContextEngine?.();
      if (!engine?.switchTopic) {
        return asTextResult("memory-v2 context engine is not active");
      }
      const topic = await engine.switchTopic(params.sessionId, params.topicId);
      return asTextResult(topic);
    }
  });

  api.registerTool({
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
          items: { type: "string" }
        }
      }
    },
    async execute(_invocationId: string, params: MemorySaveFactParams) {
      const engine = api.runtime?.getContextEngine?.();
      if (!engine?.saveFact) {
        return asTextResult("memory-v2 context engine is not active");
      }
      const result = await engine.saveFact(params);
      return asTextResult(result);
    }
  });

  api.registerTool({
    name: "memory_compact_topic",
    description: "Force refresh the summary for the current or selected topic",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["sessionId"],
      properties: {
        sessionId: { type: "string" },
        topicId: { type: ["string", "null"] }
      }
    },
    async execute(_invocationId: string, params: MemoryCompactTopicParams) {
      const engine = api.runtime?.getContextEngine?.();
      if (!engine?.compactTopic) {
        return asTextResult("memory-v2 context engine is not active");
      }
      const result = await engine.compactTopic(params);
      return asTextResult(result);
    }
  });

  api.registerTool({
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
        limit: { type: "integer", minimum: 1, maximum: 20 }
      }
    },
    async execute(_invocationId: string, params: MemorySearchParams) {
      const engine = api.runtime?.getContextEngine?.();
      if (!engine?.searchMemory) {
        return asTextResult("memory-v2 context engine is not active");
      }
      const result = await engine.searchMemory(params);
      return asTextResult(result);
    }
  });
}
