# bamdra-memory-operator

Planned skill for guiding agents to use `bamdra-memory` tools correctly.

This skill should remain thin and policy-focused. The runtime memory behavior belongs in plugins and shared packages.
It is optional and should not be treated as a deployment dependency.

The preferred style is semantic judgment over exhaustive phrase matching:

- infer when a conversation likely started a new topic
- infer when it likely returned to an older branch
- search or save memory when continuity benefits, not simply because a keyword appeared
- preserve agent and user isolation even when continuity would be convenient

## Format Notes

- `SKILL.md` should use normal OpenClaw skill frontmatter with `name` and `description`.
- `SKILL.md` should describe the decision policy: when to use memory tools, when not to use them, topic-shift judgment, privacy boundaries, and how visible the behavior should be to users.
- `TOOLS.md` is not a capability registry; it should only hold environment-specific notes that help memory write better facts.
