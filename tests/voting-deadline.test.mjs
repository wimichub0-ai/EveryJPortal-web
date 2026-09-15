import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getVotingDeadline } from '../src/lib/voting-deadline.ts';

const now = Date.parse('2026-09-15T12:00:00Z');

test('null and invalid deadlines reserve no countdown', () => {
  assert.deepEqual(getVotingDeadline(true, null, now), { votingOpen: true, remaining: null });
  assert.deepEqual(getVotingDeadline(true, 'invalid', now), { votingOpen: true, remaining: null });
});
test('future deadline counts full remaining seconds', () => {
  assert.deepEqual(getVotingDeadline(true, '2026-09-16T13:01:01Z', now), { votingOpen: true, remaining: 90061 });
  assert.equal(getVotingDeadline(true, '2026-09-15T12:00:00.500Z', now).remaining, 1);
});
test('at and after the deadline voting ends without negative values', () => {
  for (const offset of [0, 1, 60000]) {
    assert.deepEqual(getVotingDeadline(true, '2026-09-15T12:00:00Z', now + offset), { votingOpen: false, remaining: 0 });
  }
});
test('manual closure wins even with a future or missing deadline', () => {
  assert.equal(getVotingDeadline(false, '2026-09-16T12:00:00Z', now).votingOpen, false);
  assert.deepEqual(getVotingDeadline(false, null, now), { votingOpen: false, remaining: null });
});
test('SSR and first hydration wait for the client clock', () => {
  assert.equal(getVotingDeadline(true, '2026-09-16T12:00:00Z', null).remaining, null);
});
