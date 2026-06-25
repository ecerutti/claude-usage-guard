#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing dependencies..."
npm install --prefix "$SCRIPT_DIR"

echo "Copying statusLine capture script..."
mkdir -p ~/.claude/scripts
cp "$SCRIPT_DIR/scripts/usage-capture.js" ~/.claude/scripts/usage-capture.js

echo "Registering MCP server (user scope)..."
claude mcp add --transport stdio --scope user usage-guard -- node "$SCRIPT_DIR/index.js"

echo ""
echo "Done. One manual step remaining — add this to ~/.claude/settings.json:"
echo ""
echo '  "statusLine": {'
echo '    "type": "command",'
echo "    \"command\": \"node $HOME/.claude/scripts/usage-capture.js\""
echo '  }'
echo ""
echo "Then restart Claude Code. The tool check_usage_limits will be available."
