# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog, and this project follows Semantic Versioning.

This changelog currently starts at `1.3.0`. Earlier history is available in the git log.

## [1.3.0] - 2026-03-09

### Added

- Added `safe`, `balanced`, and `fast` execution profiles to `grace-multiagent-execute`.
- Added controller-built execution packets to reduce repeated plan and graph reads during execution.
- Added targeted graph refresh guidance for wave-level reconciliation.
- Added explicit verification levels for module, wave, and phase checks.
- Added this `CHANGELOG.md` file.

### Changed

- Aligned `grace-execute` with the newer packet-driven, controller-managed execution model.
- Updated `grace-generate` to support controller-friendly graph delta proposals in multi-agent workflows.
- Updated `grace-reviewer` to support `scoped-gate`, `wave-audit`, and `full-integrity` review modes.
- Updated `grace-refresh` to distinguish between `targeted` and `full` refresh modes.
- Updated GRACE subagent role prompts to match scoped reviews, controller-owned shared artifact updates, and level-based verification.
- Updated `README.md` and package metadata for the `1.3.0` release.

### Fixed

- Resolved the workflow conflict where `grace-generate` previously implied direct `knowledge-graph.xml` edits even when `grace-multiagent-execute` required controller-owned graph synchronization.
