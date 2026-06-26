# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-26

First public release.

### Added
- MCP server exposing Claude Code rate-limit usage via the `check_usage_limits`
  tool.
- `statusLine` capture script that persists rate-limit data to
  `~/.claude/usage_state.json`.
- `LICENSE` file (MIT).
- Unit tests for the usage-report logic (`npm test`, Node's built-in runner).
- npm packaging: `bin` entries so the server and capture script can be run from
  a global install, plus full `package.json` metadata.
- Contributor docs: `CONTRIBUTING.md`, `SECURITY.md`, issue/PR templates.
- GitHub Actions CI running the test suite on Node 18/20/22.
- `setup.sh` / `uninstall.sh` helpers for the git-clone install flow.

### Notes
- The pure report-building logic lives in `lib/usage.js`, kept free of I/O so it
  can be unit-tested.
- The capture script is `scripts/usage-capture.cjs` (CommonJS), so it runs
  correctly regardless of the surrounding package type.

[1.0.0]: https://github.com/ecerutti/claude-usage-guard/releases/tag/v1.0.0
