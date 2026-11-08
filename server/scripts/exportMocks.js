// Dumps REAL API responses (from the synced MongoDB snapshot) to client/src/mocks/ so the UI can be built offline.
//   npm run export:mocks      (needs MONGODB_URI; server routes are called in-process on an ephemeral port)
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { loadEngine } from '../src/services/snapshot.js';

const OUT = path.resolve(import.meta.dirname, '../../client/src/mocks');
const SCENARIO = { type: 'one_time', name: 'Laptop', amountCents: 200000, startDate: '2026-12-01' };

await mongoose.connect(process.env.MONGODB_URI);
const server = app.listen(0);
const base = `http://localhost:${server.address().port}/api/v1`;
const call = async (p, body) => {
  const res = await fetch(base + p, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(`${p} -> ${res.status}`);
  return res.json();
};
const write = async (file, data) => {
  await fs.mkdir(path.dirname(path.join(OUT, file)), { recursive: true });
  await fs.writeFile(path.join(OUT, file), `${JSON.stringify(data, null, 2)}\n`);
};

try {
  const { profiles } = await call('/profiles');
  await write('profiles.json', { profiles });
  // Mock-mode what-if/recommendations run the client engine copy on these inputs, so they must match the live engine.
  const FLOW_KEYS = ['name', 'kind', 'category', 'signedAmountCents', 'grossAmountCents', 'frequency', 'nextDate', 'endDate', 'active'];
  const inputs = {};
  for (const { slug } of profiles) {
    const { input } = await loadEngine(slug);
    inputs[slug] = { ...input, flows: input.flows.map((f) => Object.fromEntries(FLOW_KEYS.map((k) => [k, f[k] ?? null]))) };
  }
  await write('engine-inputs.json', { _note: 'MOCK DATA. Forecast engine inputs (services/snapshot.js loadEngine().input) written by `npm run export:mocks`; used only by mock-mode scenario evaluation and recommendations so they match the live engine.', profiles: inputs });
  for (const { slug } of profiles) {
    const p = `/profiles/${slug}`;
    await write(`${slug}/overview.json`, await call(`${p}/overview`));
    await write(`${slug}/transactions.json`, await call(`${p}/transactions?limit=100`));
    await write(`${slug}/spending.json`, await call(`${p}/spending?months=3`));
    await write(`${slug}/health-metrics.json`, await call(`${p}/health-metrics`));
    await write(`${slug}/forecast.json`, await call(`${p}/forecast`));
    await write(`${slug}/recommendations.json`, await call(`${p}/recommendations`));
    await write(`${slug}/scenario-one-time.json`, { request: SCENARIO, response: await call(`${p}/scenarios/evaluate`, SCENARIO) });
    await write(`${slug}/explanation-forecast.json`, await call(`${p}/explanations`, { subject: 'forecast' }));
    console.log('exported', slug);
  }
} finally {
  server.close();
  await mongoose.disconnect();
}
