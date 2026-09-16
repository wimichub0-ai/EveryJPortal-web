import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rankCreators } from '../src/lib/rank-creators.ts';
import { creatorShareData, shareCreatorLink } from '../src/lib/share-creator.ts';

test('evicted leaders are excluded and remaining creators fill the top three', () => {
  const creators = ['a', 'b', 'c', 'd'].map((id, index) => ({ id, display_order: index, is_evicted: id === 'a' }));
  const counts = { a: 1000, b: 40, c: 40, d: 20 };
  assert.deepEqual(rankCreators(creators, counts).map((c) => c.id), ['b', 'c', 'd']);
  assert.equal(counts.a, 1000); // History is untouched.
  assert.equal(rankCreators(creators.map((c) => ({ ...c, is_evicted: true })), counts).length, 0);
});

test('evicted native shares describe the story without asking for votes', () => {
  const data = creatorShareData({ name: 'Ada', slug: 'ada', is_evicted: true }, 'https://vote.example.com');
  assert.equal(data.title, "Ada's House Of Creator story");
  assert.match(data.text, /subscribe/);
  assert.doesNotMatch(data.text, /with a vote/);
  assert.equal(data.url, 'https://vote.example.com/c/ada');
});

test('evicted links still copy successfully', async () => {
  let copied;
  assert.equal(await shareCreatorLink({ name: 'Ada', slug: 'ada', is_evicted: true }, 'https://vote.example.com', {
    clipboard: { writeText: async (url) => { copied = url; } },
  }), 'copied');
  assert.equal(copied, 'https://vote.example.com/c/ada');
});
