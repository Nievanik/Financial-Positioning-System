import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { limiter } from './rateLimit.js';

test('returns 429 in the standard error shape after the limit', async () => {
  const app = express();
  app.get('/x', limiter(2), (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  const url = `http://localhost:${server.address().port}/x`;
  try {
    assert.equal((await fetch(url)).status, 200);
    assert.equal((await fetch(url)).status, 200);
    const third = await fetch(url);
    assert.equal(third.status, 429);
    assert.equal((await third.json()).error.code, 'RATE_LIMITED');
  } finally { server.close(); }
});
