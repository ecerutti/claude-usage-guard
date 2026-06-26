#!/usr/bin/env bash
set -e

echo "Uninstalling claude-usage-guard..."

# 1. Remove MCP server registration
if claude mcp remove usage-guard 2>/dev/null; then
  echo "✓ MCP server removed"
else
  echo "  MCP server was not registered (skipping)"
fi

# 2. Remove statusLine from ~/.claude/settings.json
SETTINGS="$HOME/.claude/settings.json"
if [ -f "$SETTINGS" ]; then
  NODE_BIN=$(command -v node 2>/dev/null || command -v nodejs 2>/dev/null || true)
  if [ -n "$NODE_BIN" ]; then
    NODE_BIN=$(realpath "$NODE_BIN")
  fi
  PYTHON_BIN=$(command -v python3 2>/dev/null || true)

  if [ -n "$NODE_BIN" ]; then
    "$NODE_BIN" -e "
      const fs = require('fs');
      const s = JSON.parse(fs.readFileSync(process.env.SETTINGS, 'utf-8'));
      delete s.statusLine;
      fs.writeFileSync(process.env.SETTINGS, JSON.stringify(s, null, 2) + '\n');
    " SETTINGS="$SETTINGS" && echo "✓ statusLine removed from settings.json"
  elif [ -n "$PYTHON_BIN" ]; then
    SETTINGS="$SETTINGS" "$PYTHON_BIN" -c "
import json, os
path = os.environ['SETTINGS']
with open(path) as f:
    s = json.load(f)
s.pop('statusLine', None)
with open(path, 'w') as f:
    json.dump(s, f, indent=2)
    f.write('\n')
" && echo "✓ statusLine removed from settings.json"
  else
    echo "! Could not auto-edit settings.json (no node or python3 found)"
    echo "  Remove the \"statusLine\" key manually from: $SETTINGS"
  fi
else
  echo "  settings.json not found (skipping)"
fi

# 3. Remove capture script (and any legacy .js copy from older versions)
rm -f "$HOME/.claude/scripts/usage-capture.cjs" "$HOME/.claude/scripts/usage-capture.js"
echo "✓ Capture script removed"

# 4. Remove state file
rm -f "$HOME/.claude/usage_state.json"
echo "✓ State file removed"

echo ""
echo "Done. Restart Claude Code to apply changes."
echo "You can now delete this repository directory if you no longer need it."
