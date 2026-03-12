import type {
  FactCategory,
  FactRecallPolicy,
  FactSensitivity,
  MemorySearchResult,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";
import type { ContextEngineMemoryV2Plugin } from "@openclaw-enhanced/bamdra-memory-context-engine";

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
