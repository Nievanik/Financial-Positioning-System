// Seeds the 3 demo customers INTO NESSIE (docs/engineering.md section 6). Dry-run by default: validates and prints, posts nothing.
//   npm run seed                      dry-run
//   npm run seed -- --post            really POST (permanent: Nessie has no DELETE) and record nessieCustomerId in MongoDB
//   npm run seed -- --post --replace  post NEW customers even if a slug is already seeded; after each post succeeds, delete that
//                                     profile's accounts/transactions/loans/flows (incl. user edits) in MongoDB. Then run sync:nessie.
import mongoose from 'mongoose';
import { ASOF, PROFILES } from './demoData.js';
import { buildPlan, simulate } from './seedPlan.js';
import { createNessieClient, validateRecord, idOf } from '../src/services/nessie/client.js';
import DemoProfile from '../src/models/DemoProfile.js';
import Account from '../src/models/Account.js';
import Transaction from '../src/models/Transaction.js';
import Loan from '../src/models/Loan.js';
import RecurringCashFlow from '../src/models/RecurringCashFlow.js';

const post = process.argv.includes('--post');
const replace = process.argv.includes('--replace');
const usd = (c) => (c === null ? 'n/a' : `$${(c / 100).toFixed(0)}`);

function report(plan) {
  const counts = {};
  for (const r of plan.records) { validateRecord(r.resource, r.body); counts[r.resource] = (counts[r.resource] || 0) + 1; }
  const s = simulate(plan);
  console.log(`\n== ${plan.slug} (${plan.customer.first_name} ${plan.customer.last_name})`);
  console.log('  records:', JSON.stringify(counts));
  console.log('  month-end cash:', s.forecast.checkpoints.map((c) => `${c.date} ${usd(c.cashCents)}`).join(' | '));
  console.log('  first shortfall:', s.forecast.shortfalls[0]?.date ?? 'none', `| days below $0: ${s.forecast.shortfalls.length} | min cash ${usd(s.safety.minCashCents)}`);
  console.log(`  emergency coverage: ${s.emergencyCoverageMonths?.toFixed(1)} mo | debt burden: ${(s.debtBurden * 100).toFixed(0)}%`);
}

async function postPlan(client, plan) {
  const existing = await DemoProfile.findOne({ slug: plan.slug });
  if (existing?.nessieCustomerId && !replace) { console.log(`skip ${plan.slug}: already seeded as ${existing.nessieCustomerId}`); return; }
  const cust = await client.createCustomer(plan.customer);
  const customerId = idOf(cust.objectCreated);
  try {
    const ids = {};
    for (const [key, body] of Object.entries(plan.accounts)) ids[key] = idOf((await client.createAccount(customerId, body)).objectCreated);
    for (const r of plan.records) await client.createRecord(ids[r.account], r.resource, r.body);
    // Old rows only go once the new customer is fully posted, so a failed post leaves the previous snapshot intact.
    if (existing) for (const M of [Account, Transaction, Loan, RecurringCashFlow]) await M.deleteMany({ profileId: existing._id });
    await DemoProfile.findOneAndUpdate(
      { slug: plan.slug },
      { slug: plan.slug, displayName: `${plan.customer.first_name} ${plan.customer.last_name}`, nessieCustomerId: customerId, lastSyncedAt: null, 'forecastSettings.asOfDate': ASOF, 'forecastSettings.categoryOverridesCents': {} },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.log(`posted ${plan.slug}: customer ${customerId}, ${plan.records.length} records`);
  } catch (err) {
    // Partial seed: the customer exists in Nessie but is NOT recorded in MongoDB. Do not re-run blindly (it would create a duplicate).
    console.error(`FAILED mid-seed for ${plan.slug}. Orphan Nessie customer ${customerId}. Reason: ${err.message}`);
    throw err;
  }
}

const plans = PROFILES.map(buildPlan);
plans.forEach(report);
if (!post) { console.log('\nDry run only. Re-run with `--post` to write to Nessie.'); process.exit(0); }

await mongoose.connect(process.env.MONGODB_URI);
const client = createNessieClient({ timeoutMs: 30000 });
try { for (const plan of plans) await postPlan(client, plan); } finally { await mongoose.disconnect(); }
