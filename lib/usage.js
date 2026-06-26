// Pure, side-effect-free helpers for turning a captured usage_state.json
// snapshot into the structured report exposed by the MCP tool. Kept separate
// from index.js so the transformation logic can be unit-tested without I/O.

export const FRESH_THRESHOLD = 60; // seconds
export const STALE_THRESHOLD = 300; // seconds

export function toISOLocal(epochSeconds) {
  return new Date(epochSeconds * 1000).toISOString();
}

export function secondsUntil(epochSeconds, now = Date.now()) {
  return Math.max(0, Math.floor(epochSeconds - now / 1000));
}

export function getFreshness(capturedAt, now = Date.now()) {
  const ageSeconds = (now - new Date(capturedAt).getTime()) / 1000;
  if (ageSeconds < FRESH_THRESHOLD) return 'fresh';
  if (ageSeconds < STALE_THRESHOLD) return 'stale';
  return 'unavailable';
}

function unavailableReport() {
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

// raw: parsed contents of usage_state.json, or null/undefined when the file
// is missing or unreadable. Returns the report shape the MCP tool emits.
export function buildUsageReport(raw, now = Date.now()) {
  if (!raw) return unavailableReport();

  const freshness = getFreshness(raw.captured_at, now);
  const fh = raw.five_hour;
  const sd = raw.seven_day;

  return {
    session_used_pct: fh?.used_percentage ?? null,
    session_resets_at: fh?.resets_at ? toISOLocal(fh.resets_at) : null,
    session_resets_in_seconds: fh?.resets_at ? secondsUntil(fh.resets_at, now) : null,
    weekly_used_pct: sd?.used_percentage ?? null,
    weekly_resets_at: sd?.resets_at ? toISOLocal(sd.resets_at) : null,
    weekly_resets_in_seconds: sd?.resets_at ? secondsUntil(sd.resets_at, now) : null,
    data_freshness: freshness,
    captured_at: raw.captured_at ?? null,
  };
}
