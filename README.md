# claude-usage-guard

[![CI](https://github.com/ecerutti/claude-usage-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/ecerutti/claude-usage-guard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

An MCP server that exposes Claude Code's real-time rate limit usage so that an orchestrator (Leader agent) can check remaining capacity before launching subtasks — and pause when approaching limits rather than failing mid-workflow.

## The problem

Claude Code enforces two rate limit windows: a 5-hour session window and a 7-day weekly window. When running multi-agent workflows, an orchestrator has no native way to know how much quota remains before launching a batch of subtasks. The workflow can stall mid-execution when the limit is hit, leaving work in an incomplete state.

## How it works

Two components work together:

**1. statusLine capture script** (`scripts/usage-capture.cjs`)  
Registered as Claude Code's `statusLine` command. Receives the internal JSON that Claude Code passes after each response — which includes the parsed `anthropic-ratelimit-*` headers — and persists the rate limit data to `~/.claude/usage_state.json`.

**2. MCP server** (`index.js`)  
Exposes a single tool `check_usage_limits` that reads `~/.claude/usage_state.json` and returns structured data the orchestrator can reason over.

> **Note:** The `rate_limits` field is only available for Claude.ai Pro/Max subscribers (not direct API key users), and only after the first API response in a session.

## Installation

**Requirements:** Node.js 18+, Claude Code CLI

### Option A — npm (recommended)

```bash
npm install -g claude-usage-guard
```

Register the MCP server at user scope:

```bash
claude mcp add --transport stdio --scope user usage-guard -- claude-usage-guard
```

Then add the `statusLine` entry to `~/.claude/settings.json`:

```json
"statusLine": {
  "type": "command",
  "command": "claude-usage-guard-statusline"
}
```

> If Claude Code can't find the command (e.g. you use nvm and its bin dir isn't
> on Claude Code's PATH), use the absolute path printed by `which claude-usage-guard`
> / `which claude-usage-guard-statusline` instead.

### Option B — git clone + setup script

```bash
git clone https://github.com/ecerutti/claude-usage-guard.git
cd claude-usage-guard
bash setup.sh
```

The setup script:
- Installs npm dependencies
- Copies the capture script to `~/.claude/scripts/`
- Registers the MCP server at user scope (`claude mcp add --scope user`)

Then add the `statusLine` entry to `~/.claude/settings.json` manually (the setup script prints the exact snippet to add). To remove everything later, run `bash uninstall.sh`.

### Verify

```bash
claude mcp list
# → usage-guard: ... - ✔ Connected
```

## Tool output

`check_usage_limits` takes no parameters and returns:

```json
{
  "session_used_pct": 42.5,
  "session_resets_at": "2026-06-25T18:30:00.000Z",
  "session_resets_in_seconds": 5700,
  "weekly_used_pct": 15.3,
  "weekly_resets_at": "2026-07-02T04:00:00.000Z",
  "weekly_resets_in_seconds": 601500,
  "data_freshness": "fresh",
  "captured_at": "2026-06-25T16:45:00.000Z"
}
```

| Field | Description |
|---|---|
| `session_used_pct` | % of 5-hour window consumed (0–100) |
| `weekly_used_pct` | % of 7-day window consumed (0–100) |
| `*_resets_in_seconds` | Seconds until that window resets |
| `data_freshness` | `"fresh"` <60s · `"stale"` 60–300s · `"unavailable"` >300s or no data |
| `captured_at` | ISO 8601 timestamp of last capture |

Each window field can be `null` independently if not yet available.

## Using in an orchestrator prompt

Add this to your Leader agent's CLAUDE.md or system prompt:

```
Before launching any subtask (Task tool or parallel agents), call check_usage_limits.

Decision rules:
- data_freshness "unavailable" → proceed with caution, no usage data yet
- session_used_pct > 80 → do NOT launch heavy tasks; check session_resets_in_seconds,
  wait that duration (Bash sleep or schedule a wakeup), then re-check before continuing
- Otherwise → proceed normally

Always note remaining capacity in your task plan so you can resume pending work
after a reset if you need to pause mid-workflow.
```

## Design decisions

- **No recommendation field.** The tool exposes raw data only. The orchestrator model reasons over it directly — pre-baked thresholds would be wrong for different workloads.
- **Fail-open.** If data is unavailable, the tool returns null fields rather than blocking — the orchestrator decides what to do with missing information.
- **statusLine is the only reliable source.** Scraping claude.ai is blocked by Cloudflare. The `rate_limits` field in the statusLine JSON is the only official, non-fragile way to access this data from outside the API layer.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set
up the project, run the tests (`npm test`), and open a pull request. For security
issues, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Esteban Cerutti
