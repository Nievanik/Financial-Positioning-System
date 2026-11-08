// Investment routes against the canonical demo profiles (scripts/demoData.js), run without MongoDB by
// injecting a loadSnapshot that returns the same account shapes the sync writes.
import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import express from 'express'
import { ASOF, PROFILES } from '../../scripts/demoData.js'
import { errorHandler, httpError, notFound } from '../middleware/errorHandler.js'
import { resetStore } from '../services/investments/planStore.js'
import { createInvestmentRouter } from './investments.routes.js'

const snapshots = Object.fromEntries(
  PROFILES.map((p) => [
    p.slug,
    {
      profile: { slug: p.slug, displayName: `${p.first} ${p.last}` },
      asOf: ASOF,
      accounts: [
        { _id: `${p.slug}-chk`, name: 'Checking', type: 'checking', balanceCents: p.checking * 100, source: 'nessie' },
        { _id: `${p.slug}-sav`, name: 'Savings', type: 'savings', balanceCents: p.savings * 100, source: 'nessie' },
        { _id: `${p.slug}-crd`, name: 'Card', type: 'credit_card', balanceCents: p.card.balance * 100, creditLimitCents: p.card.limit * 100, source: 'nessie' },
        { _id: `${p.slug}-401k`, name: '401(k)', type: 'retirement', balanceCents: p.supplemental.retirement401kCents, source: 'supplemental_synthetic' },
        ...p.supplemental.investments.map((h) => ({ _id: `${p.slug}-${h.key}`, source: 'supplemental_synthetic', ...h })),
      ],
    },
  ]),
)
const loadSnapshot = async (slug) => {
  if (!Object.hasOwn(snapshots, slug)) throw httpError(404, 'PROFILE_NOT_FOUND', 'Unknown demo profile')
  return snapshots[slug]
}

let server
let baseUrl
const balanced = { usStocks: 45, intlStocks: 15, bonds: 30, cdsCash: 10 }
async function call(method, path, body) {
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, body: await res.json() }
}

before(async () => {
  const app = express()
  app.use(express.json())
  app.use('/api/v1', createInvestmentRouter({ loadSnapshot, limit: (_q, _r, next) => next() }))
  app.use(notFound)
  app.use(errorHandler)
  server = app.listen(0)
  await new Promise((r) => server.once('listening', r))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})
after(() => new Promise((r) => server.close(r)))
beforeEach(() => resetStore())

describe('canonical profiles', () => {
  it('serves all three canonical slugs and preserves each 401(k) balance', async () => {
    for (const p of PROFILES) {
      const r = await call('GET', `/profiles/${p.slug}/investments/portfolio`)
      assert.equal(r.status, 200, p.slug)
      assert.equal(r.body.asOf, ASOF)
      assert.equal(r.body.profile.displayName, `${p.first} ${p.last}`)
      assert.equal(r.body.accounts.find((a) => a.type === 'retirement').balanceCents, p.supplemental.retirement401kCents)
      assert.equal(r.body.liquidCash.availableCashCents, (p.checking + p.savings) * 100)
      const expectTotal = p.supplemental.retirement401kCents + p.supplemental.investments.reduce((s, h) => s + h.balanceCents, 0)
      assert.equal(r.body.totalLongTermCents, expectTotal, p.slug)
    }
  })
  it('old slugs and unknown profiles return 404 PROFILE_NOT_FOUND', async () => {
    for (const slug of ['early-career', 'debt-pressure', 'nope']) {
      const r = await call('GET', `/profiles/${slug}/investments/portfolio`)
      assert.equal(r.status, 404)
      assert.equal(r.body.error.code, 'PROFILE_NOT_FOUND')
    }
  })
  it('assumptions are global and labeled hypothetical', async () => {
    const r = await call('GET', '/investments/assumptions')
    assert.equal(r.body.label, 'Hypothetical')
    assert.equal(r.body.presets.length, 3)
  })
})

describe('CDs', () => {
  it('lists the steady-saver CDs by maturity with string account ids and no decision', async () => {
    const r = await call('GET', '/profiles/steady-saver/investments/cds')
    assert.deepEqual(r.body.cds.map((c) => c.accountId), ['steady-saver-cd-6m', 'steady-saver-cd-12m'])
    assert.equal(r.body.cds[0].daysToMaturity, 34)
    assert.equal(r.body.cds[0].decision, null)
    assert.equal(r.body.storage.resetsOnRestart, true)
  })
  it('records a CD decision without executing it; non-CD accounts are rejected', async () => {
    const ok = await call('POST', '/profiles/cash-crunch/investments/cds/cash-crunch-cd-9m/decision', { action: 'move_to_savings', decision: 'approved' })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.decision.executed, false)
    const portfolio = await call('GET', '/profiles/cash-crunch/investments/portfolio')
    assert.equal(portfolio.body.liquidCash.availableCashCents, (700 + 100) * 100) // nothing moved
    const bad = await call('POST', '/profiles/cash-crunch/investments/cds/cash-crunch-401k/decision', { action: 'renew_12', decision: 'approved' })
    assert.equal(bad.body.error.code, 'CD_NOT_FOUND')
    assert.equal((await call('DELETE', '/profiles/cash-crunch/investments/cds/cash-crunch-cd-9m/decision')).body.removed, true)
  })
})

describe('allocation and plans', () => {
  it('simulates deterministically and validates the 100% total', async () => {
    const body = { allocation: balanced, amountCents: 1_000_000, years: 10 }
    const a = await call('POST', '/profiles/debt-heavy/investments/allocations/simulate', body)
    const b = await call('POST', '/profiles/debt-heavy/investments/allocations/simulate', body)
    assert.equal(a.status, 200)
    assert.deepEqual(a.body, b.body)
    const bad = await call('POST', '/profiles/debt-heavy/investments/allocations/simulate', { ...body, allocation: { ...balanced, cdsCash: 11 } })
    assert.equal(bad.status, 400)
    assert.equal(bad.body.error.details.field, 'allocation')
  })
  it('saves pending, approves once (409 after), never executes, and resets with the store', async () => {
    const path = '/profiles/steady-saver/investments/plans'
    const saved = await call('POST', path, { name: 'Balanced', allocation: balanced, amountCents: 100000, years: 5 })
    assert.equal(saved.status, 201)
    assert.equal(saved.body.plan.status, 'pending')
    const id = saved.body.plan.id
    const approved = await call('POST', `${path}/${id}/decision`, { decision: 'approved' })
    assert.deepEqual([approved.body.plan.status, approved.body.plan.executed], ['approved', false])
    assert.equal((await call('POST', `${path}/${id}/decision`, { decision: 'rejected' })).status, 409)
    assert.equal((await call('GET', '/profiles/cash-crunch/investments/plans')).body.plans.length, 0)
    resetStore()
    assert.equal((await call('GET', path)).body.plans.length, 0)
  })
})
