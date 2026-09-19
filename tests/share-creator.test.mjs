import assert from 'node:assert/strict';
import { test } from 'node:test';
import { creatorShareData, shareCreatorLink } from '../src/lib/share-creator.ts';

const creator = { name: 'Ada', slug: 'ada-creates' };
const origin = 'https://vote.example.com';
const expected = {
  title: 'Support Ada in House Of Creator',
  text: 'Support Ada in House Of Creator with a vote 🗳️',
  url: 'https://vote.example.com/c/ada-creates',
};

test('creates the exact shared title, text and creator URL', () => {
  assert.deepEqual(creatorShareData(creator, origin), expected);
});

test('uses native sharing when available without copying', async () => {
  let shared;
  assert.equal(await shareCreatorLink(creator, origin, {
    share: async (data) => { shared = data; },
    clipboard: { writeText: async () => assert.fail('Should not copy after sharing') },
  }), 'shared');
  assert.deepEqual(shared, expected);
});

test('copies the creator URL when native sharing is unavailable', async () => {
  let copied;
  assert.equal(await shareCreatorLink(creator, origin, {
    clipboard: { writeText: async (url) => { copied = url; } },
  }), 'copied');
  assert.equal(copied, expected.url);
});

test('cancelling the native sheet does not copy or report success', async () => {
  assert.equal(await shareCreatorLink(creator, origin, {
    share: async () => { throw new DOMException('Cancelled', 'AbortError'); },
    clipboard: { writeText: async () => assert.fail('Should not copy on cancellation') },
  }), 'cancelled');
});

test('native sharing failure falls back to copying', async () => {
  let copied;
  assert.equal(await shareCreatorLink(creator, origin, {
    share: async () => { throw new Error('Unavailable'); },
    clipboard: { writeText: async (url) => { copied = url; } },
  }), 'copied');
  assert.equal(copied, expected.url);
});

test('clipboard failure propagates instead of reporting Link copied', async () => {
  await assert.rejects(shareCreatorLink(creator, origin, {
    clipboard: { writeText: async () => { throw new Error('Denied'); } },
  }), /Denied/);
  await assert.rejects(shareCreatorLink(creator, origin, {}), /Clipboard unavailable/);
});


test('winner shares celebrate the winner and preserve the creator link', async () => {
  const winner = { ...creator, is_winner: true };
  const data = creatorShareData(winner, origin);
  assert.equal(data.title, 'Ada won House Of Creator! 🏆');
  assert.equal(data.text, 'Ada won House Of Creator! 🏆');
  assert.equal(data.url, expected.url);
  let shared;
  await shareCreatorLink(winner, origin, { share: async (data) => { shared = data; } });
  assert.deepEqual(shared, data);
});

test('final standing shares do not ask for more votes', () => {
  const data = creatorShareData({ ...creator, final_standing: true }, origin);
  assert.doesNotMatch(data.text, /with a vote/);
  assert.equal(data.url, expected.url);
});
