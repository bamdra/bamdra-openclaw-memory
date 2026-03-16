import type {
  AssembledContext,
  FactRecord,
  MemoryV2Config,
  RecentTopicMessage,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";

export interface ContextAssemblyInput {
  sessionId: string;
  topic: TopicRecord | null;
  recentMessages: RecentTopicMessage[];
  alwaysFacts: Array<FactRecord & { tags: string[] }>;
  topicFacts: Array<FactRecord & { tags: string[] }>;
}

export class ContextAssembler {
  constructor(private readonly config: MemoryV2Config) {}

  assemble(input: ContextAssemblyInput): AssembledContext {
    const sections: AssembledContext["sections"] = [];

    if (input.topic) {
      sections.push({
        kind: "topic",
        content: `Topic: ${input.topic.title}\nLabels: ${joinList(input.topic.labels)}`,
      });

      if (this.config.contextAssembly?.includeTopicShortSummary !== false) {
        sections.push({
          kind: "summary",
          content: input.topic.summaryShort || "(no short summary yet)",
        });
      }

      if (
        this.config.contextAssembly?.includeOpenLoops !== false &&
        input.topic.openLoops.length > 0
      ) {
        sections.push({
          kind: "open_loops",
          content: input.topic.openLoops.map((item) => `- ${item}`).join("\n"),
        });
      }
    }

    const facts = [
      ...limitFacts(
        input.alwaysFacts,
        this.config.contextAssembly?.alwaysFactLimit ?? 12,
      ),
      ...limitFacts(
        input.topicFacts,
        this.config.contextAssembly?.topicFactLimit ?? 16,
      ),
    ];

    if (facts.length > 0) {
      sections.push({
        kind: "facts",
        content: facts
          .map((fact) => {
            const prefix =
              fact.sensitivity === "secret_ref"
                ? "[secret-ref]"
                : `[${fact.category}]`;
            return `${prefix} ${fact.key}: ${fact.value}`;
          })
          .join("\n"),
      });
    }

    if (input.recentMessages.length > 0) {
      sections.push({
        kind: "recent_messages",
        content: input.recentMessages
          .map(({ message }) => `${message.role}: ${message.text}`)
          .join("\n"),
      });
    }

    return {
      sessionId: input.sessionId,
      topicId: input.topic?.id ?? null,
      text: sections
        .map((section) => `[${section.kind}]\n${section.content}`)
        .join("\n\n"),
      sections,
    };
  }
}

function joinList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}

function limitFacts<T>(values: T[], limit: number): T[] {
  return values.slice(0, Math.max(0, limit));
}
