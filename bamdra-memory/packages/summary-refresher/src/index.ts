import type {
  FactRecord,
  MemoryV2Config,
  RecentTopicMessage,
  TopicRecord,
} from "@openclaw-enhanced/memory-core";

export interface SummaryRefreshInput {
  topic: TopicRecord;
  recentMessages: RecentTopicMessage[];
  facts: Array<FactRecord & { tags: string[] }>;
}

export class SummaryRefresher {
  constructor(private readonly _config: MemoryV2Config) {}

  refresh(input: SummaryRefreshInput): Pick<TopicRecord, "summaryShort" | "summaryLong"> {
    const latestMessage = input.recentMessages.at(-1)?.message.text ?? input.topic.summaryShort;
    const factFragments = input.facts
      .slice(0, 2)
      .map((fact) => `${fact.key}=${fact.value}`)
      .join("; ");
    const loopFragment =
      input.topic.openLoops.length > 0
        ? ` Open loops: ${input.topic.openLoops.slice(-2).join(" | ")}.`
        : "";

    const summaryShort = truncate(
      [input.topic.title, latestMessage, factFragments]
        .filter(Boolean)
        .join(" | "),
      220,
    );

    const summaryLong = truncate(
      `${summaryShort}${loopFragment}`,
      600,
    );

    return {
      summaryShort,
      summaryLong,
    };
  }
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}...`;
}
