# Changelog

## v0.2.0 - 2026-03-16

### Added

- standalone project metadata for the public repository, including root `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, and release packaging scripts
- a polished `bamdra-memory-operator` skill centered on semantic topic judgment, privacy boundaries, and low-noise memory behavior
- integration coverage for explicit new-topic phrases and cross-process tool bootstrap behavior
- release-oriented documentation for prompting, usage, installation, and tool semantics

### Changed

- fixed OpenClaw 2026.3.13 runtime integration to use the current hook APIs and enabled topic tracking through the active runtime path
- improved topic routing so explicit new-topic phrases and clear semantic shifts spawn fresh topics more reliably
- strengthened tool registration by exposing both `memory_*` and `bamdra_*` aliases with the same behavior
- hardened tool-side runtime resolution so the tools plugin can bootstrap against the same SQLite store even across process boundaries
- clarified the product boundary as continuity within the correct agent and user isolation boundary, not global shared memory

### Fixed

- prevented `memory-core` slot conflicts from shadowing the external memory plugin
- fixed SQLite-backed persistence and restart recovery with `node:sqlite`
- fixed missing hook registration on newer OpenClaw runtimes
- fixed monitoring and documentation mismatches around schema fields and tool semantics

### Notes

- `bamdra_*` tools are aliases of the `memory_*` tools and are documented as the same operations
- GitHub Releases are the recommended installation path for most users
