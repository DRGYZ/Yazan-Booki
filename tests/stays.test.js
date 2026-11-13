import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { test } from 'node:test';
import { selectStays, stays } from '../src/stays.js';

const defaults = { query: '', types: [], budget: false, sort: 'recommended' };

test('search matches names without accents and combines with type and budget', () => {
  const filters = { ...defaults, query: 'hotel marseille', types: ['hotel'], budget: true };
  assert.deepEqual(selectStays(filters).map((stay) => stay.id), ['de-la-mer', 'soleil']);
  assert.equal(selectStays({ ...defaults, query: 'coeur' })[0].id, 'coeur-eau');
});

test('sorting produces a new list without changing the catalogue order', () => {
  const prices = selectStays({ ...defaults, sort: 'price-asc' }).map((stay) => stay.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  assert.equal(selectStays(defaults)[0].id, 'du-port');
});

test('each stay has both sizes of its local image', async () => {
  for (const stay of stays) {
    const base = '../assets/photos/' + (stay.photo ?? stay.id);
    await access(new URL(base + '.webp', import.meta.url));
    await access(new URL(base + '-small.webp', import.meta.url));
  }
});
