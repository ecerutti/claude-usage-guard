# Security Policy

## Supported versions

This project follows the latest release on `main`. Security fixes are applied to
the most recent version.

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report them privately via GitHub's
[private vulnerability reporting](https://github.com/ecerutti/claude-usage-guard/security/advisories/new),
or by email to **esteban.cerutti@gmail.com**.

Include:

- A description of the vulnerability and its impact.
- Steps to reproduce, if possible.
- Any suggested remediation.

You can expect an acknowledgement within a few days. Please allow reasonable time
for a fix before any public disclosure.

## Scope notes

This tool reads a local state file (`~/.claude/usage_state.json`) written by the
Claude Code `statusLine` hook and exposes it over a local stdio MCP transport. It
does not open network ports or transmit data externally. The data it surfaces is
your own rate-limit usage. Keep this in mind when assessing severity.
