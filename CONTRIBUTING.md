# Contributing

Thanks for contributing to `openclaw-topic-memory`.

## Development Flow

1. Create a feature branch.
2. Install dependencies:

```bash
pnpm install
```

3. Validate before opening a PR:

```bash
pnpm build
pnpm test
```

## Good Contribution Areas

- better memory behavior
- topic routing improvements
- safer recall behavior
- OpenClaw integration alignment
- docs, examples, and onboarding

## Documentation Rule

If you change user-facing behavior, update the matching docs in both:

- `bamdra-memory/docs/en/`
- `bamdra-memory/docs/zh-CN/`

## Style

- keep plugin adapters thin
- keep docs practical
- preserve local-first defaults
- treat Redis as optional cache, not the source of truth
