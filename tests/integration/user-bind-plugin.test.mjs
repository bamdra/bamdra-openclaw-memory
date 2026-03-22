import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import * as userBindPlugin from "../../../bamdra-user-bind/dist/index.js";

test("user-bind resolves stable native channel identities and allows admin natural-language edits", { concurrency: false }, async () => {
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
    sessionId: "agent:test-agent:telegram:direct:123456",
    channel: { type: "telegram" },
    sender: { id: "123456", name: "Alex" },
  });

  const myProfile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-1", {
    sessionId: "agent:test-agent:telegram:direct:123456",
  });
  assert.match(myProfile.content[0].text, /Alex/);
  assert.match(myProfile.content[0].text, /telegram:123456/);

  const adminEdit = await tools.get("bamdra_user_bind_admin_edit").execute("inv-2", {
    sessionId: "agent:test-agent:telegram:direct:123456",
    agentId: "admin-agent",
    instruction: "修改 用户:telegram:123456 称呼: Alex, 角色: founder",
  });
  assert.match(adminEdit.content[0].text, /Alex/);
  assert.match(adminEdit.content[0].text, /founder/);

  const adminQuery = await tools.get("bamdra_user_bind_admin_query").execute("inv-3", {
    sessionId: "agent:test-agent:telegram:direct:123456",
    agentId: "admin-agent",
    instruction: "查询 用户:telegram:123456",
  });
  assert.match(adminQuery.content[0].text, /founder/);
});

test("user-bind denies admin tools to non-admin agents", { concurrency: false }, async () => {
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
    sessionId: "agent:test-agent:telegram:direct:123456",
    channel: { type: "telegram" },
    sender: { id: "123456", name: "Alex" },
  });

  await assert.rejects(
    () => tools.get("bamdra_user_bind_admin_query").execute("inv-4", {
      sessionId: "agent:test-agent:telegram:direct:123456",
      agentId: "guest-agent",
      instruction: "查询 用户:telegram:123456",
    }),
    /access denied/,
  );
});

test("user-bind resolves identity from untrusted metadata blocks for native channels", { concurrency: false }, async () => {
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
    sessionId: "agent:test-agent:whatsapp:direct:15551234567@s.whatsapp.net",
    text: `Conversation info (untrusted metadata):
\`\`\`json
{"message_id":"wamid.1","sender_id":"15551234567@s.whatsapp.net","sender":"Taylor"}
\`\`\`

Sender (untrusted metadata):
\`\`\`json
{"label":"Taylor (15551234567@s.whatsapp.net)","id":"15551234567@s.whatsapp.net","name":"Taylor"}
\`\`\`

[message_id: om_1]
Taylor: Please remember I prefer concise replies.`,
  });

  const myProfile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-5", {
    sessionId: "agent:test-agent:whatsapp:direct:15551234567@s.whatsapp.net",
  });
  assert.match(myProfile.content[0].text, /Taylor/);
  assert.match(myProfile.content[0].text, /whatsapp:15551234567@s\.whatsapp\.net/);
});

test("user-bind keeps non-feishu channel identities stable across supported channels", { concurrency: false }, async () => {
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

  const fixtures = [
    { channel: "telegram", senderId: "123456789", senderName: "Tg User", expected: "telegram:123456789" },
    { channel: "whatsapp", senderId: "15550001111@s.whatsapp.net", senderName: "Wa User", expected: "whatsapp:15550001111@s.whatsapp.net" },
    { channel: "discord", senderId: "824367912341234567", senderName: "Dc User", expected: "discord:824367912341234567" },
    { channel: "googlechat", senderId: "users/123456789", senderName: "Gc User", expected: "googlechat:users/123456789" },
    { channel: "slack", senderId: "U123ABC456", senderName: "Slack User", expected: "slack:U123ABC456" },
    { channel: "mattermost", senderId: "8k9q7h6j5g4f3d2s1a0", senderName: "Mm User", expected: "mattermost:8k9q7h6j5g4f3d2s1a0" },
    { channel: "signal", senderId: "+15551112222", senderName: "Signal User", expected: "signal:+15551112222" },
    { channel: "imessage", senderId: "+8613800138000", senderName: "iMsg User", expected: "imessage:+8613800138000" },
    { channel: "msteams", senderId: "8:orgid:12345678-1234-1234-1234-123456789012", senderName: "Teams User", expected: "msteams:8:orgid:12345678-1234-1234-1234-123456789012" },
  ];

  for (const fixture of fixtures) {
    const sessionId = `agent:test-agent:${fixture.channel}:direct:${fixture.senderId}`;
    await hooks[0].handler({
      sessionId,
      channel: { type: fixture.channel },
      sender: { id: fixture.senderId, name: fixture.senderName },
    });
    const profile = await tools.get("bamdra_user_bind_get_my_profile").execute(`inv-${fixture.channel}`, {
      sessionId,
    });
    assert.match(profile.content[0].text, new RegExp(fixture.expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(profile.content[0].text, new RegExp(fixture.senderName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("user-bind markdown only renders confirmed fields and no longer emits template guidance blocks", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const sessionId = "agent:test-agent:telegram:direct:123456";
  await hooks[0].handler({
    sessionId,
    channel: { type: "telegram" },
    sender: { id: "123456", name: "Alex" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-md", {
    sessionId,
    nickname: "Alex",
    preferences: "先给结论再展开",
  });

  const markdown = readFileSync(join(dir, "profiles", "private", "telegram_123456.md"), "utf8");
  assert.match(markdown, /nickname: Alex/);
  assert.match(markdown, /preferences: 先给结论再展开/);
  assert.doesNotMatch(markdown, /personality:\s*null/);
  assert.doesNotMatch(markdown, /role:\s*null/);
  assert.doesNotMatch(markdown, /## 使用建议/);
});

test("user-bind can extract latest user utterance from sessionManager-backed events", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool() {},
  });

  const sessionId = "agent:test-agent:telegram:direct:123456";
  const branch = [
    {
      type: "message",
      message: {
        role: "user",
        content: [
          {
            type: "text",
            text: "以后叫我阿丰，回答先给结论再展开",
          },
        ],
      },
    },
  ];

  await hooks[0].handler({
    sessionId,
    channel: { type: "telegram" },
    sender: { id: "123456", name: "Alex" },
    sessionManager: {
      getSessionId() {
        return sessionId;
      },
      getBranch() {
        return branch;
      },
    },
  });

  const markdown = readFileSync(join(dir, "profiles", "private", "telegram_123456.md"), "utf8");
  assert.match(markdown, /userId: telegram:123456/);
});

test("user-bind persists a provisional profile when open_id exists but no stable binding is available", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const sessionId = "agent:document-agent:feishu:direct:ou_missing_binding";
  await hooks[0].handler({
    sessionId,
    channel: { type: "feishu" },
    sender: { id: "ou_missing_binding", name: "Zhang Feng" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-provisional", {
    sessionId,
    nickname: "丰哥",
    preferences: "先给结论再展开",
  });

  const profile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-provisional-read", {
    sessionId,
  });
  assert.match(profile.content[0].text, /"userId": "feishu:oid_/);
  assert.match(profile.content[0].text, /丰哥/);
  assert.match(profile.content[0].text, /先给结论再展开/);
});

test("user-bind merges a provisional open_id profile into the stable profile after binding becomes available", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const sessionId = "agent:document-agent:feishu:direct:ou_rebind_me";
  await hooks[0].handler({
    sessionId,
    channel: { type: "feishu" },
    sender: { id: "ou_rebind_me", name: "Zhang Feng" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-premerge", {
    sessionId,
    nickname: "丰哥",
    preferences: "回答先给结论",
  });

  const db = new DatabaseSync(join(dir, "profiles.sqlite"));
  db.prepare(`
    UPDATE bamdra_user_bind_bindings
    SET user_id = ?, external_user_id = ?, source = ?, updated_at = ?
    WHERE channel_type = ? AND open_id = ?
  `).run(
    "feishu:7bf43f2c",
    "7bf43f2c",
    "manual-openid-link",
    new Date().toISOString(),
    "feishu",
    "ou_rebind_me",
  );
  db.close();

  await hooks[0].handler({
    sessionId,
    channel: { type: "feishu" },
    sender: { id: "ou_rebind_me", name: "Zhang Feng" },
  });
  await tools.get("bamdra_user_bind_refresh_my_binding").execute("inv-refresh", {
    sessionId,
  });

  const stableProfile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-postmerge", {
    sessionId,
  });
  assert.match(stableProfile.content[0].text, /feishu:7bf43f2c/);
  assert.match(stableProfile.content[0].text, /丰哥/);
  assert.match(stableProfile.content[0].text, /回答先给结论/);

  const stableMarkdown = readFileSync(join(dir, "profiles", "private", "feishu_7bf43f2c.md"), "utf8");
  assert.match(stableMarkdown, /nickname: 丰哥/);
  assert.match(stableMarkdown, /preferences: 回答先给结论/);

  const verifyDb = new DatabaseSync(join(dir, "profiles.sqlite"));
  const rows = verifyDb.prepare("SELECT user_id FROM bamdra_user_bind_profiles ORDER BY user_id").all()
    .map((row) => ({ user_id: row.user_id }));
  verifyDb.close();
  assert.deepEqual(rows, [{ user_id: "feishu:7bf43f2c" }]);
});

test("user-bind background sweep can reconcile provisional feishu profiles without waiting for a new message", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  const runtime = userBindPlugin.createUserBindPlugin({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });
  runtime.register();

  const sessionId = "agent:document-agent:feishu:direct:ou_background_rebind";
  await hooks[0].handler({
    sessionId,
    channel: { type: "feishu" },
    sender: { id: "ou_background_rebind", name: "Zhang Feng" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-bg-pre", {
    sessionId,
    nickname: "丰哥",
    preferences: "先给结论",
  });

  const db = new DatabaseSync(join(dir, "profiles.sqlite"));
  db.prepare(`
    UPDATE bamdra_user_bind_bindings
    SET user_id = ?, external_user_id = ?, source = ?, updated_at = ?
    WHERE channel_type = ? AND open_id = ?
  `).run(
    "feishu:7bf43f2c",
    "7bf43f2c",
    "manual-openid-link",
    new Date().toISOString(),
    "feishu",
    "ou_background_rebind",
  );
  db.close();

  await globalThis.__OPENCLAW_BAMDRA_USER_BIND__.runPendingBindingSweep();
  await tools.get("bamdra_user_bind_refresh_my_binding").execute("inv-bg-refresh", {
    sessionId,
  });

  const stableProfile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-bg-post", {
    sessionId,
  });
  assert.match(stableProfile.content[0].text, /feishu:7bf43f2c/);
  assert.match(stableProfile.content[0].text, /丰哥/);
  assert.match(stableProfile.content[0].text, /先给结论/);
});

test("user-bind allows manual markdown edits to sync back into the profile store", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const sessionId = "agent:test-agent:telegram:direct:123456";
  await hooks[0].handler({
    sessionId,
    channel: { type: "telegram" },
    sender: { id: "123456", name: "Alex" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-dual-1", {
    sessionId,
    nickname: "Alex",
    preferences: "先给结论",
  });

  const markdownPath = join(dir, "profiles", "private", "telegram_123456.md");
  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-dual-2", {
    sessionId,
    nickname: "阿丰",
    preferences: "先给结论再展开",
  });

  const currentMarkdown = readFileSync(markdownPath, "utf8");
  const manuallyEditedMarkdown = currentMarkdown
    .replace("nickname: 阿丰", "nickname: 丰哥")
    .replace("preferences: 先给结论再展开", "preferences: 回答直接一点")
    .replace(/updatedAt: .+/u, `updatedAt: ${new Date(Date.now() + 20_000).toISOString()}`)
    .replace(/syncHash: .+/u, "syncHash: manual-edit");
  writeFileSync(markdownPath, manuallyEditedMarkdown, "utf8");
  utimesSync(markdownPath, new Date(Date.now() + 10_000), new Date(Date.now() + 10_000));
  await tools.get("bamdra_user_bind_refresh_my_binding").execute("inv-dual-refresh", {
    sessionId,
  });

  const profileAfterManualEdit = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-dual-4", {
    sessionId,
  });
  assert.match(profileAfterManualEdit.content[0].text, /丰哥/);
  assert.match(profileAfterManualEdit.content[0].text, /回答直接一点/);
});


test("user-bind can capture semantic profile updates during before_prompt_build", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const beforePromptHandlers = [];
  const tools = new Map();
  const originalHome = process.env.HOME;
  const originalFetch = globalThis.fetch;

  mkdirSync(join(dir, ".openclaw"), { recursive: true });
  writeFileSync(join(dir, ".openclaw", "openclaw.json"), JSON.stringify({
    models: {
      primary: "mock/gpt-test",
      providers: {
        mock: {
          api: "openai-completions",
          baseUrl: "https://mock.local/v1",
          apiKey: "test-key",
        },
      },
    },
  }), "utf8");
  process.env.HOME = dir;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                should_update: true,
                confidence: 0.98,
                patch: {
                  nickname: "丰哥",
                  preferences: "先给结论再展开",
                },
              }),
            },
          },
        ],
      };
    },
  });

  try {
    userBindPlugin.register({
      config: {
        enabled: true,
        localStorePath: dir,
        exportPath: join(dir, "exports"),
        profileMarkdownRoot: join(dir, "profiles", "private"),
        adminAgents: ["admin-agent"],
      },
      registerHook(events, handler) {
        hooks.push({ events, handler });
      },
      on(eventName, handler) {
        beforePromptHandlers.push({ eventName, handler });
      },
      registerTool(definition) {
        tools.set(definition.name, definition);
      },
    });

    const sessionId = "agent:main:feishu:direct:ou_before_prompt";
    await hooks[0].handler({
      sessionId,
      channel: { type: "feishu" },
      sender: { id: "ou_before_prompt", name: "Zhang Feng" },
    });

    const beforePrompt = beforePromptHandlers.find((entry) => entry.eventName === "before_prompt_build");
    assert.ok(beforePrompt);

    await beforePrompt.handler(
      { text: "以后叫我丰哥，回答先给结论再展开" },
      {
        sessionId,
        channel: { type: "feishu" },
        sender: { id: "ou_before_prompt", name: "Zhang Feng" },
      },
    );

    const profile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-before-prompt", {
      sessionId,
    });
    assert.match(profile.content[0].text, /丰哥/);
    assert.match(profile.content[0].text, /先给结论再展开/);
  } finally {
    process.env.HOME = originalHome;
    globalThis.fetch = originalFetch;
  }
});

test("user-bind supports append semantics for stable preferences", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const sessionId = "agent:test-agent:telegram:direct:append-case";
  await hooks[0].handler({
    sessionId,
    channel: { type: "telegram" },
    sender: { id: "append-case", name: "Alex" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-append-1", {
    sessionId,
    preferences: "先给结论",
  });
  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-append-2", {
    sessionId,
    preferences: "别太官方",
    preferencesOperation: "append",
  });

  const profile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-append-3", {
    sessionId,
  });
  assert.match(profile.content[0].text, /先给结论/);
  assert.match(profile.content[0].text, /别太官方/);
});

test("user-bind supports removing a specific stable preference", { concurrency: false }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "bamdra-user-bind-"));
  const hooks = [];
  const tools = new Map();

  userBindPlugin.register({
    config: {
      enabled: true,
      localStorePath: dir,
      exportPath: join(dir, "exports"),
      profileMarkdownRoot: join(dir, "profiles", "private"),
      adminAgents: ["admin-agent"],
    },
    registerHook(events, handler) {
      hooks.push({ events, handler });
    },
    registerTool(definition) {
      tools.set(definition.name, definition);
    },
  });

  const sessionId = "agent:test-agent:telegram:direct:remove-case";
  await hooks[0].handler({
    sessionId,
    channel: { type: "telegram" },
    sender: { id: "remove-case", name: "Alex" },
  });

  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-remove-1", {
    sessionId,
    preferences: "先给结论；别太官方",
  });
  await tools.get("bamdra_user_bind_update_my_profile").execute("inv-remove-2", {
    sessionId,
    preferences: "别太官方",
    preferencesOperation: "remove",
  });

  const profile = await tools.get("bamdra_user_bind_get_my_profile").execute("inv-remove-3", {
    sessionId,
  });
  assert.match(profile.content[0].text, /先给结论/);
  assert.doesNotMatch(profile.content[0].text, /别太官方/);
});
