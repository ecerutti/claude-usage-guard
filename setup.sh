#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect node with absolute path (handles nvm, asdf, and non-standard installs)
NODE_BIN=$(command -v node 2>/dev/null || command -v nodejs 2>/dev/null || true)
if [ -z "$NODE_BIN" ]; then
  echo "Error: Node.js not found in PATH."
  echo "Install it from https://nodejs.org or via nvm: https://github.com/nvm-sh/nvm"
  exit 1
fi
NODE_BIN=$(realpath "$NODE_BIN")
echo "Using Node.js: $NODE_BIN ($(${NODE_BIN} --version))"

echo "Installing dependencies..."
npm install --prefix "$SCRIPT_DIR"

echo "Copying statusLine capture script..."
mkdir -p ~/.claude/scripts
cp "$SCRIPT_DIR/scripts/usage-capture.js" ~/.claude/scripts/usage-capture.js

echo "Registering MCP server (user scope)..."
claude mcp add --transport stdio --scope user usage-guard -- "$NODE_BIN" "$SCRIPT_DIR/index.js"

echo ""
echo "Done. One manual step remaining — add this to ~/.claude/settings.json:"
echo ""
echo '  "statusLine": {'
echo '    "type": "command",'
echo "    \"command\": \"$NODE_BIN $HOME/.claude/scripts/usage-capture.js\""
echo '  }'
echo ""
echo "Then restart Claude Code. The tool check_usage_limits will be available."
