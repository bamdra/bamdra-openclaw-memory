import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as userBindPlugin from "../../../bamdra-user-bind/dist/index.js";

test("user-bind resolves current profile and allows admin natural-language edits", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const ingestHook = hooks[0];
  await ingestHook.handler({
    sessionId: "session-feishu",
    channel: { type: "feishu" },
    sender: { id: "ou_123", name: "张三" },
  });

  const myProfile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-1", {
    sessionId: "session-feishu",
  });
  assert.match(myProfile.content[0].text, /张三/);
  assert.match(myProfile.content[0].text, /feishu:ou_123/);

  const adminEdit = await tools.get("bamdra_user_bind_admin_edit").execute("inv-2", {
    sessionId: "session-feishu",
    agentId: "admin-agent",
    instruction: "修改 用户:feishu:ou_123 称呼: 张总, 角色: 财务负责人",
  });
  assert.match(adminEdit.content[0].text, /张总/);
  assert.match(adminEdit.content[0].text, /财务负责人/);

  const adminQuery = await tools.get("bamdra_user_bind_admin_query").execute("inv-3", {
    sessionId: "session-feishu",
    agentId: "admin-agent",
    instruction: "查询 用户:feishu:ou_123",
  });
  assert.match(adminQuery.content[0].text, /张总/);
});

test("user-bind denies admin tools to non-admin agents", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  await hooks[0].handler({
    sessionId: "session-feishu",
    channel: { type: "feishu" },
    sender: { id: "ou_123", name: "张三" },
  });

  await assert.rejects(
    () => tools.get("bamdra_user_bind_admin_query").execute("inv-4", {
      sessionId: "session-feishu",
      agentId: "guest-agent",
      instruction: "查询 用户:feishu:ou_123",
    }),
    /access denied/,
  );
});

test("user-bind resolves identity from untrusted metadata blocks and generates a profile record", async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  await hooks[0].handler({
    sessionId: "agent:test-agent:feishu:direct:ou_456",
    text: `Conversation info (untrusted metadata):
\`\`\`json
{"message_id":"om_1","sender_id":"ou_456","sender":"张丰"}
\`\`\`

Sender (untrusted metadata):
\`\`\`json
{"label":"张丰 (ou_456)","id":"ou_456","name":"张丰"}
\`\`\`

[message_id: om_1]
张丰: 记住，以后称呼我为老板。`,
  });

  const myProfile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-5", {
    sessionId: "agent:test-agent:feishu:direct:ou_456",
  });
  assert.match(myProfile.content[0].text, /张丰/);
  assert.match(myProfile.content[0].text, /feishu:ou_456/);
});
