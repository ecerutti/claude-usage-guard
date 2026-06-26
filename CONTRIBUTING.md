# Contributing to claude-usage-guard

Thanks for taking the time to contribute! This is a small, focused project, so
contributions of any size — bug reports, docs fixes, or features — are welcome.

## Getting started

**Requirements:** Node.js 18+ and the [Claude Code CLI](https://docs.claude.com/en/docs/claude-code).

```bash
git clone https://github.com/ecerutti/claude-usage-guard.git
cd claude-usage-guard
npm install
npm test
```

## Project layout

| Path | Purpose |
|---|---|
| `index.js` | MCP server entrypoint. Exposes the `check_usage_limits` tool. |
| `lib/usage.js` | Pure, testable logic that turns a captured snapshot into the report shape. |
| `scripts/usage-capture.cjs` | The `statusLine` capture script that writes `~/.claude/usage_state.json`. |
| `test/` | Unit tests (Node's built-in test runner). |
| `setup.sh` / `uninstall.sh` | Install / uninstall helpers for the git-clone flow. |

The transformation logic lives in `lib/usage.js` and is kept free of I/O so it
can be unit-tested without touching the filesystem. New logic should follow that
split: keep file reads at the boundary (`index.js` / the capture script) and put
pure data-shaping in `lib/`.

## Running tests

```bash
npm test
```

Tests use Node's built-in runner (`node --test`) — no extra dependencies. Please
add or update tests for any behavior change in `lib/`.

## Making a change

1. Fork the repo and create a branch off `main`.
2. Make your change, keeping the existing style (2-space indent, ES modules).
3. Add or update tests and make sure `npm test` passes.
4. Open a pull request describing **what** changed and **why**. Link any related
   issue.

## Reporting bugs / requesting features

Open an [issue](https://github.com/ecerutti/claude-usage-guard/issues) using the
templates provided. For bugs, include your Node version, OS, and the output of
`claude mcp list` where relevant.

## Code of conduct

Be respectful and constructive. We follow the spirit of the
[Contributor Covenant](https://www.contributor-covenant.org/).
