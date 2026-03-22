# Changelog

## v0.3.19 - 2026-03-23

### Changed

- refreshed the suite documentation to cover the standalone Clawdhub upgrade skill more clearly across installation, downloads, and user-bind guidance
- documented the newer user-bind profile model, including machine-readable frontmatter, the mirrored human-readable profile section, and semantic profile update behavior

### Fixed

- aligned automatic all-agent skill injection with both `agents.list` and object-map agent config layouts without corrupting `agents.defaults`
- updated bundled guidance so user-profile facts are routed to `bamdra-user-bind` rather than being stored as shared memory facts

### Notes

- this release pairs with `@bamdra/bamdra-user-bind@0.1.13`

## v0.3.18 - 2026-03-22

### Added

- bundled a new `bamdra-memory-upgrade-operator` skill with a backup-first upgrade script so users can repair stale config, existing plugin directories, and partial suite installs without hand-editing `openclaw.json`

### Fixed

- materialize the new upgrade skill into `~/.openclaw/skills/` during both npm `postinstall` bootstrap and runtime bootstrap fallback

## v0.3.17 - 2026-03-22

### Fixed

- added an npm `postinstall` bootstrap so `openclaw plugins install @bamdra/bamdra-openclaw-memory` can patch `~/.openclaw/openclaw.json`, materialize companion plugins, and copy bundled skills before the plugin is ever enabled
- removed the install-time dependency on first runtime activation, which meant some OpenClaw CLI install and update flows appeared to ignore the suite bootstrap entirely
- aligned the published plugin manifest version with the package version so install metadata no longer reports the old `0.3.15`

## v0.3.16 - 2026-03-22

### Changed

- clarified the prompt policy so `bamdra-user-bind` is treated as the primary per-user personalization layer and workspace `USER.md` files stay thin
- refreshed installation and prompting docs to explain that preferred address and other stable user traits should live in the bound profile, not be duplicated across prompt files
- aligned the release metadata with the published plugin package version and the new companion plugin patch releases

### Notes

- this release pairs with `@bamdra/bamdra-user-bind@0.1.11` and `@bamdra/bamdra-memory-vector@0.1.11`
- the runtime behavior is unchanged for existing installs; this release mainly closes the gap between bootstrap behavior, prompting guidance, and published metadata

## v0.3.15 - 2026-03-20

### Fixed

- added OpenClaw 2026.3.13 compatibility aliases so older runtimes calling `contextEngine.assemble()` and `contextEngine.ingest()` no longer fail after install
- expanded host bootstrap coverage so installing `bamdra-openclaw-memory` fully backfills `bamdra-user-bind` runtime config instead of leaving partial dependency entries behind
- hardened automatic suite setup to disable conflicting built-in memory plugins including `memory-core` and `memory-lancedb`
- switched bundled `bamdra-memory-vector` provisioning to auto-enable the vector entry and default paths during bootstrap so the suite lands in one consistent ready state
- tightened the published Node.js engine requirement to `>=22.12.0` to match the runtime features the suite actually uses

### Notes

- this release is intended for users on OpenClaw `2026.3.13` who saw `contextEngine` load or interface mismatch errors after installing the suite
- successful npm install should now leave `bamdra-openclaw-memory` bound to both `plugins.slots.memory` and `plugins.slots.contextEngine`, with built-in competing memory plugins disabled
- the suite now treats vector recall as part of the default installed stack rather than an opt-in post-install step

## v0.3.14 - 2026-03-19

### Fixed

- bounded `before_prompt_build` memory injection so image-plus-text requests no longer get oversized system context from `bamdra-openclaw-memory`
- added multimodal-aware prompt budgeting that shrinks injected memory context when the inbound payload already contains images or other non-text parts
- trimmed assembled facts, summaries, recent messages, and local knowledge recall snippets to keep prompt growth predictable without requiring users to clean extensions or rewrite config

### Notes

- this is a smooth in-place upgrade for existing `~/.openclaw/extensions/bamdra-openclaw-memory` installs
- no memory database reset, package cleanup, or config deletion is required
- existing installs can keep their current `openclaw.json`; the new guardrails work with defaults even when `contextAssembly` is absent

## v0.3.1 - 2026-03-17

### Added

- automatic host bootstrap on first plugin load so installation can backfill `tools.allow`, all-agent `skills`, the compatibility `contextEngine` slot, and default runtime config without manual JSON edits
- bundled skill materialization into `~/.openclaw/skills/bamdra-memory-operator` when the target directory does not already exist
- regression coverage for host bootstrap idempotency, including the rule that an existing global skill copy must never be overwritten

### Fixed

- fixed the last install-time gap where OpenClaw would load the plugin but leave memory tools and agent skills unbound
- fixed nested-workspace build reliability by resolving local `typescript` and `tsup` binaries across both standalone and umbrella-repo layouts

## v0.3.0 - 2026-03-17

### Added

- a true unified OpenClaw plugin package, `bamdra-openclaw-memory`, that combines memory-slot registration, runtime hooks, and explicit tools in one installable extension
- integration coverage for the unified plugin runtime path so slot binding and built-in tool aliases are validated together
- release packaging for the single-plugin distribution layout

### Changed

- switched the recommended install model from the old context-engine plus tools pair to a single `bamdra-openclaw-memory` plugin directory
- updated example configs so one plugin now occupies both the `memory` slot and the compatibility `contextEngine` slot while explicitly denying `memory-core`
- hardened plugin bundling so the distributed `dist/index.js` files inline workspace dependencies and remain runnable outside the monorepo
- refreshed installation and integration docs to match the one-plugin workflow and clearer 0.3.0 product story

### Fixed

- fixed standalone bundle behavior after release cleanup removed local workspace symlinks
- fixed nested-repo typecheck stability by giving the public package its own local TypeScript path mapping
- fixed post-build declaration availability by preserving `tsc -b` outputs while bundling CommonJS runtime files

## v0.2.0 - 2026-03-16

### Added

- standalone project metadata for the public repository, including root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, and release packaging scripts
- a polished `bamdra-memory-operator` skill centered on semantic topic judgment, privacy boundaries, and low-noise memory behavior
- integration coverage for explicit new-topic phrases and cross-process tool bootstrap behavior
- release-oriented documentation for prompting, usage, installation, and tool semantics

### Changed

- fixed OpenClaw 2026.3.13 runtime integration to use the current hook APIs and enabled topic tracking through the active runtime path
- improved topic routing so explicit new-topic phrases and clear semantic shifts spawn fresh topics more reliably
- simplified tool registration to one canonical `memory_*` tool set
- hardened tool-side runtime resolution so the tools plugin can bootstrap against the same SQLite store even across process boundaries
- clarified the product boundary as continuity within the correct agent and user isolation boundary, not global shared memory

### Fixed

- prevented `memory-core` slot conflicts from shadowing the external memory plugin
- fixed SQLite-backed persistence and restart recovery with `node:sqlite`
- fixed missing hook registration on newer OpenClaw runtimes
- fixed monitoring and documentation mismatches around schema fields and tool semantics

### Notes

- the canonical runtime tool set is `memory_*`
- GitHub Releases are the recommended installation path for most users
