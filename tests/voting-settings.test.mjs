import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeVotingSettings, resumeSeconds } from '../src/lib/voting-settings.ts';

test('explicit status wins over the retained legacy boolean', () => {
  assert.equal(normalizeVotingSettings({ voting_status: 'paused', voting_open: true }).voting_status, 'paused');
  assert.equal(normalizeVotingSettings({ voting_status: 'closed', voting_open: true }).voting_status, 'closed');
  assert.equal(normalizeVotingSettings({ voting_status: 'live', voting_open: false }).voting_status, 'live');
});
test('legacy settings still work while migration is unavailable', () => {
  assert.equal(normalizeVotingSettings({ voting_open: false }).voting_status, 'closed');
  assert.equal(normalizeVotingSettings({ voting_open: true }).voting_status, 'live');
});
test('paused countdown supports more than 24 hours and clamps stale targets', () => {
  const now = Date.parse('2026-09-16T12:00:00Z');
  assert.equal(resumeSeconds('2026-09-17T13:02:03Z', now), 90123);
  assert.equal(resumeSeconds('2026-09-16T12:00:00Z', now), 0);
  assert.equal(resumeSeconds('2026-09-16T11:59:59Z', now), 0);
  assert.equal(resumeSeconds(null, now), null);
  assert.equal(resumeSeconds('invalid', now), null);
  assert.equal(resumeSeconds('2026-09-17T13:02:03Z', null), null);
});
test('an expired resume target does not automatically override a paused admin status', () => {
  const settings = normalizeVotingSettings({ voting_status: 'paused', paused_resume_at: '2000-01-01T00:00:00Z' });
  assert.equal(settings.voting_status, 'paused');
  assert.equal(resumeSeconds(settings.paused_resume_at, Date.now()), 0);
});
