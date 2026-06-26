import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUsageReport,
  getFreshness,
  secondsUntil,
  toISOLocal,
} from '../lib/usage.js';

// A fixed "now" so time-based assertions are deterministic.
const NOW = Date.parse('2026-06-25T16:45:00.000Z');

test('toISOLocal converts epoch seconds to an ISO 8601 string', () => {
  assert.equal(toISOLocal(0), '1970-01-01T00:00:00.000Z');
  assert.equal(toISOLocal(1782758700), '2026-06-29T18:45:00.000Z');
});

test('secondsUntil returns seconds remaining, clamped at zero', () => {
  const future = NOW / 1000 + 120;
  assert.equal(secondsUntil(future, NOW), 120);

  const past = NOW / 1000 - 500;
  assert.equal(secondsUntil(past, NOW), 0);
});

test('getFreshness classifies by age of the capture', () => {
  const at = (secondsAgo) => new Date(NOW - secondsAgo * 1000).toISOString();
  assert.equal(getFreshness(at(0), NOW), 'fresh');
  assert.equal(getFreshness(at(59), NOW), 'fresh');
  assert.equal(getFreshness(at(60), NOW), 'stale');
  assert.equal(getFreshness(at(299), NOW), 'stale');
  assert.equal(getFreshness(at(300), NOW), 'unavailable');
  assert.equal(getFreshness(at(10000), NOW), 'unavailable');
});

test('buildUsageReport returns the unavailable shape for null input', () => {
  const report = buildUsageReport(null, NOW);
  assert.deepEqual(report, {
    session_used_pct: null,
    session_resets_at: null,
    session_resets_in_seconds: null,
    weekly_used_pct: null,
    weekly_resets_at: null,
    weekly_resets_in_seconds: null,
    data_freshness: 'unavailable',
    captured_at: null,
  });
});

test('buildUsageReport maps a full snapshot into the report shape', () => {
  const capturedAt = new Date(NOW - 10 * 1000).toISOString(); // 10s ago → fresh
  const fhReset = NOW / 1000 + 5700;
  const sdReset = NOW / 1000 + 601500;

  const report = buildUsageReport(
    {
      captured_at: capturedAt,
      five_hour: { used_percentage: 42.5, resets_at: fhReset },
      seven_day: { used_percentage: 15.3, resets_at: sdReset },
    },
    NOW
  );

  assert.equal(report.session_used_pct, 42.5);
  assert.equal(report.session_resets_in_seconds, 5700);
  assert.equal(report.session_resets_at, toISOLocal(fhReset));
  assert.equal(report.weekly_used_pct, 15.3);
  assert.equal(report.weekly_resets_in_seconds, 601500);
  assert.equal(report.weekly_resets_at, toISOLocal(sdReset));
  assert.equal(report.data_freshness, 'fresh');
  assert.equal(report.captured_at, capturedAt);
});

test('buildUsageReport handles each window being independently absent', () => {
  const capturedAt = new Date(NOW).toISOString();

  const onlySession = buildUsageReport(
    {
      captured_at: capturedAt,
      five_hour: { used_percentage: 80, resets_at: NOW / 1000 + 60 },
      seven_day: null,
    },
    NOW
  );
  assert.equal(onlySession.session_used_pct, 80);
  assert.equal(onlySession.weekly_used_pct, null);
  assert.equal(onlySession.weekly_resets_at, null);
  assert.equal(onlySession.weekly_resets_in_seconds, null);

  const empty = buildUsageReport({ captured_at: capturedAt }, NOW);
  assert.equal(empty.session_used_pct, null);
  assert.equal(empty.weekly_used_pct, null);
  assert.equal(empty.data_freshness, 'fresh');
});
