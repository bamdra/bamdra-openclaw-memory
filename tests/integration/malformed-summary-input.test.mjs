import test from "node:test";
import assert from "node:assert/strict";

import { SummaryRefresher } from "../../packages/summary-refresher/dist/index.js";

test("summary refresher tolerates malformed legacy array fields", () => {
  const refresher = new SummaryRefresher({});
  const result = refresher.refresh({
    topic: {
      id: "topic-1",
      sessionId: "session-1",
      userId: null,
      title: "Legacy Topic",
      status: "active",
      parentTopicId: null,
      summaryShort: "existing summary",
      summaryLong: "",
      openLoops: null,
      labels: [],
      createdAt: "2026-03-29T00:00:00.000Z",
      lastActiveAt: "2026-03-29T00:00:00.000Z",
    },
    recentMessages: null,
    facts: null,
  });

  assert.equal(typeof result.summaryShort, "string");
  assert.equal(typeof result.summaryLong, "string");
  assert.match(result.summaryShort, /Legacy Topic|existing summary/);
});
