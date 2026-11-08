import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ALLOCATION_PRESETS,
  availableCashCents,
  buildCdTimeline,
  buildPortfolio,
  cdStatus,
  compoundCents,
  isValidAllocation,
  riskBand,
  sharesBps,
  simpleInterestCents,
  simulateAllocation,
  stressLoss,
  weightedReturnBps,
  weightedVolatilityBps,
  RETURN_SCENARIOS,
} from './index.js'

// Holdings shaped like services/investments toHolding() output (cents, bps, YYYY-MM-DD).
const SNAP = {
  asOf: '2026-11-08',
  accounts: [
    { id: 'chk', name: 'Checking', type: 'checking', balanceCents: 350000, source: 'nessie' },
    { id: 'sav', name: 'Savings', type: 'savings', balanceCents: 1400000, source: 'nessie' },
    { id: 'crd', name: 'Card', type: 'credit_card', balanceCents: 30000, creditLimitCents: 600000, source: 'nessie' },
    { id: 'k401', name: '401(k)', type: 'retirement', balanceCents: 2800000, source: 'supplemental_synthetic' },
    { id: 'brk', name: 'Index Brokerage', type: 'investment', balanceCents: 420000, riskLevel: 'high', source: 'supplemental_synthetic' },
    { id: 'cd6', name: '6-Month CD', type: 'cd', balanceCents: 250000, riskLevel: 'low', annualRateBps: 410, maturityDate: '2026-12-12', source: 'supplemental_synthetic' },
    { id: 'cd12', name: '12-Month CD', type: 'cd', balanceCents: 500000, riskLevel: 'low', annualRateBps: 425, maturityDate: '2027-02-15', source: 'supplemental_synthetic' },
  ],
}

const balanced = { usStocks: 45, intlStocks: 15, bonds: 30, cdsCash: 10 }
const base = RETURN_SCENARIOS.find((s) => s.id === 'base')

describe('allocation validation', () => {
  it('accepts integer allocations totaling exactly 100', () => {
    ALLOCATION_PRESETS.forEach((p) => assert.equal(isValidAllocation(p.allocation), true, p.id))
  })
  it('rejects totals other than 100, fractions, negatives and unknown keys', () => {
    assert.equal(isValidAllocation({ ...balanced, cdsCash: 11 }), false)
    assert.equal(isValidAllocation({ ...balanced, usStocks: 44.5, cdsCash: 10.5 }), false)
    assert.equal(isValidAllocation({ usStocks: 110, intlStocks: -10, bonds: 0, cdsCash: 0 }), false)
    assert.equal(isValidAllocation({ ...balanced, crypto: 0 }), false)
    assert.equal(isValidAllocation(null), false)
  })
})

describe('allocation math (integer bps / cents)', () => {
  it('computes weighted return and volatility in whole basis points', () => {
    assert.equal(weightedReturnBps(balanced, base), 541) // (45*650 + 15*600 + 30*400 + 10*380) / 100 = 540.5
    assert.equal(weightedVolatilityBps(balanced), 1175)
    assert.deepEqual(riskBand(1175), { volatilityBps: 1175, band: 'elevated', label: 'Elevated' })
    assert.equal(riskBand(499).band, 'low')
    assert.equal(riskBand(1400).band, 'high')
  })
  it('compounds from the principal and returns integer cents', () => {
    assert.equal(compoundCents(1_000_000, 500, 0), 1_000_000)
    assert.equal(compoundCents(1_000_000, 500, 2), 1_102_500)
    assert.ok(Number.isInteger(compoundCents(123_457, 541, 7)))
  })
  it('stress loss is negative and scales with the stock share', () => {
    const s = stressLoss(1_000_000, balanced)
    assert.equal(s.shockBps, -1980)
    assert.equal(s.lossCents, -198_000)
    assert.equal(stressLoss(1_000_000, { usStocks: 0, intlStocks: 0, bonds: 0, cdsCash: 100 }).lossCents, 0)
  })
  it('simulation is deterministic, ordered low <= base <= high, and has years + 1 projection rows', () => {
    const input = { allocation: balanced, amountCents: 1_000_000, years: 10 }
    const a = simulateAllocation(input)
    const b = simulateAllocation(input)
    assert.deepEqual(a, b)
    assert.equal(a.projection.length, 11)
    assert.deepEqual(a.projection[0], { year: 0, low: 1_000_000, base: 1_000_000, high: 1_000_000 })
    const final = Object.fromEntries(a.scenarios.map((s) => [s.id, s.finalValueCents]))
    assert.ok(final.low <= final.base && final.base <= final.high)
    assert.equal(a.projection[10].base, final.base)
    a.projection.forEach((row) => ['low', 'base', 'high'].forEach((k) => assert.ok(Number.isInteger(row[k]))))
  })
})

describe('portfolio grouping', () => {
  const snap = SNAP
  it('keeps liquid cash (checking + savings only) out of the long-term total', () => {
    const p = buildPortfolio(snap)
    assert.equal(p.liquidCash.availableCashCents, 350000 + 1400000)
    assert.equal(p.liquidCash.includedInPortfolio, false)
    assert.equal(p.totalLongTermCents, 2800000 + 420000 + 250000 + 500000)
    assert.ok(p.accounts.every((a) => ['investment', 'retirement', 'cd'].includes(a.type)))
  })
  it('credit limits and card balances never count as cash', () => {
    assert.equal(availableCashCents([{ type: 'credit_card', balanceCents: 9000, creditLimitCents: 100000 }, { type: 'checking', balanceCents: 100 }]), 100)
  })
  it('group totals add up and shares total exactly 10000 bps', () => {
    const p = buildPortfolio(snap)
    assert.equal(p.groups.reduce((s, g) => s + g.totalCents, 0), p.totalLongTermCents)
    assert.equal(p.groups.reduce((s, g) => s + g.shareBps, 0), 10000)
    assert.deepEqual(sharesBps([1, 1, 1]), [3334, 3333, 3333])
    assert.deepEqual(sharesBps([0, 0]), [0, 0])
  })
  it('labels the 401(k) risk as assumed because the synced data has no riskLevel', () => {
    const k = buildPortfolio(snap).accounts.find((a) => a.id === 'k401')
    assert.deepEqual([k.riskLevel, k.riskIsAssumed], ['moderate', true])
  })
  it('labels assumed risk when the account has no riskLevel', () => {
    const p = buildPortfolio({ asOf: '2026-11-07', accounts: [{ id: 'x', name: 'IRA', type: 'retirement', balanceCents: 5, source: 'supplemental_synthetic' }] })
    assert.equal(p.accounts[0].riskLevel, 'moderate')
    assert.equal(p.accounts[0].riskIsAssumed, true)
  })
})

describe('CD maturity', () => {
  it('computes days, reminder date, status and sorts by maturity', () => {
    const { cds } = buildCdTimeline(SNAP.accounts, SNAP.asOf)
    assert.deepEqual(cds.map((c) => c.accountId), ['cd6', 'cd12'])
    assert.equal(cds[0].daysToMaturity, 34)
    assert.equal(cds[0].reminderDate, '2026-11-28')
    assert.equal(cds[0].status, 'upcoming')
    assert.equal(cds[1].maturityDate, '2027-02-15')
  })
  it('classifies status boundaries', () => {
    assert.equal(cdStatus(-1), 'matured')
    assert.equal(cdStatus(0), 'due_soon')
    assert.equal(cdStatus(30), 'due_soon')
    assert.equal(cdStatus(31), 'upcoming')
  })
  it('hypothetical renewal interest is simple interest in integer cents; only move_to_savings adds cash', () => {
    assert.equal(simpleInterestCents(500000, 375, 12), 18750)
    const { cds } = buildCdTimeline([{ id: 'c', name: 'CD', type: 'cd', balanceCents: 500000, maturityDate: '2026-12-01' }], '2026-11-07')
    const opts = Object.fromEntries(cds[0].options.map((o) => [o.id, o]))
    assert.equal(opts.move_to_savings.addsToAvailableCashCents, 500000)
    assert.equal(opts.renew_12.addsToAvailableCashCents, 0)
    assert.equal(opts.renew_12.estimatedInterestCents, 18750)
  })
  it('lists CDs without a maturity date separately', () => {
    const t = buildCdTimeline([{ id: 'u', name: 'Undated', type: 'cd', balanceCents: 1 }], '2026-11-07')
    assert.equal(t.cds.length, 0)
    assert.equal(t.undatedCds[0].accountId, 'u')
  })
})
