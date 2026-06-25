import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const STATE_FILE = join(homedir(), '.claude', 'usage_state.json');
const FRESH_THRESHOLD = 60;
const STALE_THRESHOLD = 300;

function toISOLocal(epochSeconds) {
  return new Date(epochSeconds * 1000).toISOString();
}

function secondsUntil(epochSeconds) {
  return Math.max(0, Math.floor(epochSeconds - Date.now() / 1000));
}

function getFreshness(capturedAt) {
  const ageSeconds = (Date.now() - new Date(capturedAt).getTime()) / 1000;
  if (ageSeconds < FRESH_THRESHOLD) return 'fresh';
  if (ageSeconds < STALE_THRESHOLD) return 'stale';
  return 'unavailable';
}

function checkUsageLimits() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return {
      session_used_pct: null,
      session_resets_at: null,
      session_resets_in_seconds: null,
      weekly_used_pct: null,
      weekly_resets_at: null,
      weekly_resets_in_seconds: null,
      data_freshness: 'unavailable',
      captured_at: null,
    };
  }

  const freshness = getFreshness(raw.captured_at);
  const fh = raw.five_hour;
  const sd = raw.seven_day;

  return {
    session_used_pct: fh?.used_percentage ?? null,
    session_resets_at: fh?.resets_at ? toISOLocal(fh.resets_at) : null,
    session_resets_in_seconds: fh?.resets_at ? secondsUntil(fh.resets_at) : null,
    weekly_used_pct: sd?.used_percentage ?? null,
    weekly_resets_at: sd?.resets_at ? toISOLocal(sd.resets_at) : null,
    weekly_resets_in_seconds: sd?.resets_at ? secondsUntil(sd.resets_at) : null,
    data_freshness: freshness,
    captured_at: raw.captured_at,
  };
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
