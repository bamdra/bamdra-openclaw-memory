# bamdra-openclaw-memory

Unified OpenClaw memory plugin that combines:

- memory context engine registration
- topic-aware hooks
- explicit memory tool registration

This is the primary install target for `v0.3.1+`.

## Install

```bash
openclaw plugins install @bamdra/bamdra-openclaw-memory
```

Then bind the plugin in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "allow": ["bamdra-openclaw-memory"],
    "deny": ["memory-core", "memory-lancedb"],
    "slots": {
      "memory": "bamdra-openclaw-memory",
      "contextEngine": "bamdra-openclaw-memory"
    }
  }
}
```

For full docs, see the main project README and installation guides in the repository root.
