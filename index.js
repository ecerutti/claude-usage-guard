#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { buildUsageReport } from './lib/usage.js';

const STATE_FILE = join(homedir(), '.claude', 'usage_state.json');

function checkUsageLimits() {
  let raw = null;
  try {
    raw = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    // Missing or unreadable state file → buildUsageReport returns the
    // "unavailable" shape (all fields null). Fail-open by design.
  }
  return buildUsageReport(raw);
}

const server = new Server(
  { name: 'usage-guard', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'check_usage_limits',
    description: 'Returns current Claude Code rate limit usage. session_used_pct and weekly_used_pct are 0-100. data_freshness is "fresh" (<60s), "stale" (60-300s), or "unavailable" (>300s or no data).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'check_usage_limits') {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(checkUsageLimits(), null, 2),
    }],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
