// Reads the seeded demo customers back from Nessie and upserts them into MongoDB (docs/engineering.md section 6).
// All fetching, normalizing and checks happen BEFORE any DB write, so a Nessie failure keeps the previous snapshot.
//   npm run sync:nessie            sync every profile that has a nessieCustomerId
//   npm run sync:nessie -- --dry   fetch + check only, no writes
import mongoose from 'mongoose';
import { MERCHANTS, PROFILES } from './demoData.js';
import { createNessieClient, idOf } from '../src/services/nessie/client.js';
import { normalizeProfile } from '../src/services/nessie/normalize.js';
import DemoProfile from '../src/models/DemoProfile.js';
import Account from '../src/models/Account.js';
import Transaction from '../src/models/Transaction.js';
import Loan from '../src/models/Loan.js';
import RecurringCashFlow from '../src/models/RecurringCashFlow.js';

const dry = process.argv.includes('--dry');
const merchants = Object.fromEntries(Object.entries(MERCHANTS).map(([key, m]) => [m.id, { key, name: m.name }]));

async function fetchProfile(client, customerId) {
  const accounts = await client.listAccounts(customerId);
  const checking = accounts.find((a) => a.type === 'Checking');
  const card = accounts.find((a) => a.type === 'Credit Card');
  // Everything except card purchases lives on the checking account (see seed notes in engineering.md).
  const list = (resource) => client.list(idOf(checking), resource);
  return {
    accounts,
    deposits: await list('deposits'), withdrawals: await list('withdrawals'), bills: await list('bills'),
    loans: await list('loans'), transfers: await list('transfers'), purchases: await list('purchases'),
    cardPurchases: await client.list(idOf(card), 'purchases'),
  };
}

// Upsert by the idempotency key (profileId, source, externalId); never inserts duplicates on re-run.
const upsertAll = (Model, profileId, docs) => Model.bulkWrite(
  docs.map((d) => ({ updateOne: { filter: { profileId, source: d.source, externalId: d.externalId }, update: { $set: { ...d, profileId } }, upsert: true } })),
);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const client = createNessieClient({ timeoutMs: 30000 });
  const profiles = await DemoProfile.find({ nessieCustomerId: { $ne: null } });
  if (!profiles.length) throw new Error('No seeded profiles (nessieCustomerId missing). Run the seed first.');

  // Phase 1: fetch + normalize + check everything. Any failure aborts before writing.
  const prepared = [];
  for (const profile of profiles) {
    const spec = PROFILES.find((p) => p.slug === profile.slug);
    if (!spec) throw new Error(`No demoData spec for ${profile.slug}`);
    const nessie = await fetchProfile(client, profile.nessieCustomerId);
    const out = normalizeProfile({
      asOf: profile.forecastSettings.asOfDate, slug: profile.slug, nessie, merchants,
      supplemental: { bills: spec.bills, loans: spec.loans.map((l) => ({ name: l.name, day: l.day, rateBps: l.rateBps })), retirement401kCents: spec.supplemental.retirement401kCents, investments: spec.supplemental.investments ?? [], creditLimitCents: spec.card.limit * 100, grossPayCents: spec.pay.gross * 100 },
    });
    if (out.issues.length) throw new Error(`${profile.slug}: ${out.issues.join('; ')}`);
    prepared.push({ profile, out });
    console.log(`${profile.slug}: ${out.accounts.length} accounts, ${out.transactions.length} transactions, ${out.loans.length} loans, ${out.flows.length} recurring flows`);
  }
  if (dry) { console.log('Dry run: nothing written.'); return; }

  // Phase 2: write. Accounts and loans first so we can resolve ObjectIds for references.
  for (const { profile, out } of prepared) {
    const profileId = profile._id;
    await upsertAll(Account, profileId, out.accounts.map(({ ...a }) => a));
    await upsertAll(Loan, profileId, out.loans);
    const acct = Object.fromEntries((await Account.find({ profileId })).map((a) => [a.externalId, a._id]));
    const loan = Object.fromEntries((await Loan.find({ profileId })).map((l) => [l.externalId, l._id]));
    const withAccount = (d) => { const { accountExternalId, ...rest } = d; return { ...rest, accountId: acct[accountExternalId] }; };
    await upsertAll(Transaction, profileId, out.transactions.map(withAccount));
    await upsertAll(RecurringCashFlow, profileId, out.flows.map((f) => { const { loanExternalId, ...rest } = withAccount(f); return { ...rest, loanId: loanExternalId ? loan[loanExternalId] : null }; }));
    profile.lastSyncedAt = new Date(); // only after everything above succeeded
    await profile.save();
    console.log(`synced ${profile.slug} at ${profile.lastSyncedAt.toISOString()}`);
  }
}

main().catch((err) => { console.error('SYNC FAILED:', err.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
