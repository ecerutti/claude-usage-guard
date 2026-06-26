#!/usr/bin/env node
const { writeFileSync } = require('fs');
const { homedir } = require('os');
const { join } = require('path');

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk));
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(Buffer.concat(chunks).toString());
  } catch {}

  const rateLimits = input.rate_limits;

  if (rateLimits) {
    const state = {
      captured_at: new Date().toISOString(),
      five_hour: rateLimits.five_hour ?? null,
      seven_day: rateLimits.seven_day ?? null,
    };
    try {
      writeFileSync(join(homedir(), '.claude', 'usage_state.json'), JSON.stringify(state, null, 2));
    } catch {}
  }

  const fh = rateLimits?.five_hour;
  const sd = rateLimits?.seven_day;

  const parts = [];
  if (fh != null) parts.push(`5h: ${Math.round(fh.used_percentage)}%`);
  if (sd != null) parts.push(`7d: ${Math.round(sd.used_percentage)}%`);

  process.stdout.write((parts.length ? `usage: ${parts.join(' | ')}` : '') + '\n');
});
