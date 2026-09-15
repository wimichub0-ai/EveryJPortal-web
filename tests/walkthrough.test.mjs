import assert from 'node:assert/strict';
import { test } from 'node:test';

 test('walkthrough seen state persists across visits and supports unavailable storage', async () => {
  const values = new Map();
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } };
  try {
    const firstVisit = await import('../src/lib/walkthrough.ts?first');
    assert.equal(firstVisit.hasSeenWalkthrough(), false);
    firstVisit.markWalkthroughSeen();
    assert.equal(firstVisit.hasSeenWalkthrough(), true);
    const returnVisit = await import('../src/lib/walkthrough.ts?return');
    assert.equal(returnVisit.hasSeenWalkthrough(), true);

    window.localStorage = {
      getItem: () => { throw new Error('Storage blocked'); },
      setItem: () => { throw new Error('Storage blocked'); },
    };
    const blockedStorage = await import('../src/lib/walkthrough.ts?blocked');
    assert.equal(blockedStorage.hasSeenWalkthrough(), false);
    assert.doesNotThrow(() => blockedStorage.markWalkthroughSeen());
    assert.equal(blockedStorage.hasSeenWalkthrough(), true);
  } finally {
    delete globalThis.window;
  }
});
