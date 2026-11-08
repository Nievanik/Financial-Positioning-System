/**
 * MOCK-MODE MIRROR of server/src/engine/investments (docs/engineering.md section 10).
 * Used only when the Express API is unavailable, so the Investment Planner still demos offline with the
 * same response shapes. The server's tested engine is the source of truth; keep these in sync with it.
 */
import { addDays, daysBetween } from '@/lib/dates'

export const ASSET_CLASSES = [
  { id: 'usStocks', label: 'U.S. stocks', volatilityBps: 1600, stressShockBps: -3000 },
  { id: 'intlStocks', label: 'International stocks', volatilityBps: 1800, stressShockBps: -3200 },
  { id: 'bonds', label: 'Bonds', volatilityBps: 600, stressShockBps: -500 },
  { id: 'cdsCash', label: 'CDs & cash equivalents', volatilityBps: 50, stressShockBps: 0 },
]
export const ASSET_CLASS_IDS = ASSET_CLASSES.map((a) => a.id)
export const RETURN_SCENARIOS = [
  { id: 'low', label: 'Weak markets', returnsBps: { usStocks: 200, intlStocks: 100, bonds: 200, cdsCash: 300 } },
  { id: 'base', label: 'Middle case', returnsBps: { usStocks: 650, intlStocks: 600, bonds: 400, cdsCash: 380 } },
  { id: 'high', label: 'Strong markets', returnsBps: { usStocks: 950, intlStocks: 900, bonds: 500, cdsCash: 420 } },
]
export const ALLOCATION_PRESETS = [
  { id: 'conservative', label: 'Conservative', allocation: { usStocks: 20, intlStocks: 10, bonds: 50, cdsCash: 20 } },
  { id: 'balanced', label: 'Balanced', allocation: { usStocks: 45, intlStocks: 15, bonds: 30, cdsCash: 10 } },
  { id: 'growth', label: 'Growth', allocation: { usStocks: 65, intlStocks: 20, bonds: 12, cdsCash: 3 } },
]
const RISK_BANDS = [
  { id: 'low', label: 'Low', belowBps: 500 },
  { id: 'moderate', label: 'Moderate', belowBps: 1000 },
  { id: 'elevated', label: 'Elevated', belowBps: 1400 },
  { id: 'high', label: 'High', belowBps: Infinity },
]
const ACCOUNT_RISK_LEVELS = {
  low: { label: 'Low risk', note: 'Principal is generally stable; the rate is fixed for the term.' },
  moderate: { label: 'Moderate risk', note: 'A mix of stocks and bonds; value can fall in a bad year.' },
  high: { label: 'Higher risk', note: 'Mostly stocks; value can swing significantly year to year.' },
}
const DEFAULT_RISK_BY_TYPE = { cd: 'low', retirement: 'moderate', investment: 'high' }
const PORTFOLIO_GROUPS = [
  { id: 'investment', label: 'Investments', types: ['investment'] },
  { id: 'retirement', label: 'Retirement', types: ['retirement'] },
  { id: 'cd', label: 'CDs', types: ['cd'] },
]
export const CD_RULES = { reminderLeadDays: 14, dueSoonDays: 30, hypotheticalRenewalRateBps: 375, renewalMonths: 12 }
export const LIMITS = { maxAmountCents: 1_000_000_000, minYears: 1, maxYears: 30, maxPlansPerProfile: 20, maxPlanName: 60 }
export const DISCLAIMER =
  'Educational simulation with synthetic data and hypothetical assumptions. Not investment advice, not a forecast, ' +
  'and not an offer. FPS never places trades, moves money, renews CDs or sends notifications.'

export const allocationTotal = (a) => ASSET_CLASS_IDS.reduce((s, id) => s + (a[id] ?? 0), 0)
const weightedReturnBps = (a, sc) => Math.round(ASSET_CLASS_IDS.reduce((s, id) => s + a[id] * sc.returnsBps[id], 0) / 100)
const weightedVolatilityBps = (a) => Math.round(ASSET_CLASSES.reduce((s, c) => s + a[c.id] * c.volatilityBps, 0) / 100)
const compoundCents = (amt, bps, year) => Math.round(amt * (1 + bps / 10_000) ** year)

export function assumptionsPayload() {
  return {
    label: 'Hypothetical',
    assetClasses: ASSET_CLASSES,
    returnScenarios: RETURN_SCENARIOS,
    presets: ALLOCATION_PRESETS,
    riskBands: RISK_BANDS.map((b) => ({ id: b.id, label: b.label, belowBps: Number.isFinite(b.belowBps) ? b.belowBps : null })),
    cdRules: CD_RULES,
    limits: LIMITS,
    disclaimer: DISCLAIMER,
  }
}

export function simulateAllocation({ allocation, amountCents, years }) {
  const scenarios = RETURN_SCENARIOS.map((s) => {
    const annualReturnBps = weightedReturnBps(allocation, s)
    return { id: s.id, label: s.label, annualReturnBps, finalValueCents: compoundCents(amountCents, annualReturnBps, years) }
  })
  const projection = Array.from({ length: years + 1 }, (_, year) => {
    const row = { year }
    scenarios.forEach((s) => {
      row[s.id] = compoundCents(amountCents, s.annualReturnBps, year)
    })
    return row
  })
  const volatilityBps = weightedVolatilityBps(allocation)
  const band = RISK_BANDS.find((b) => volatilityBps < b.belowBps)
  const shockBps = Math.round(ASSET_CLASSES.reduce((s, a) => s + allocation[a.id] * a.stressShockBps, 0) / 100)
  return {
    input: { allocation: { ...allocation }, amountCents, years },
    risk: { volatilityBps, band: band.id, label: band.label },
    scenarios,
    projection,
    stress: { shockBps, lossCents: Math.round((amountCents * shockBps) / 10_000) },
  }
}

function sharesBps(values) {
  const total = values.reduce((s, v) => s + v, 0)
  if (!total) return values.map(() => 0)
  const raw = values.map((v) => (v * 10_000) / total)
  const floors = raw.map(Math.floor)
  let left = 10_000 - floors.reduce((s, v) => s + v, 0)
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i)
    .forEach(({ i }) => {
      if (left > 0) {
        floors[i] += 1
        left -= 1
      }
    })
  return floors
}

const groupOf = (type) => PORTFOLIO_GROUPS.find((g) => g.types.includes(type))?.id ?? null

export function buildPortfolio({ accounts, asOf }) {
  const longTerm = accounts.filter((a) => groupOf(a.type))
  const groups = PORTFOLIO_GROUPS.map((g) => {
    const items = longTerm.filter((a) => g.types.includes(a.type))
    return { id: g.id, label: g.label, totalCents: items.reduce((s, a) => s + a.balanceCents, 0), accountIds: items.map((a) => a.id) }
  }).filter((g) => g.accountIds.length > 0)
  sharesBps(groups.map((g) => g.totalCents)).forEach((v, i) => {
    groups[i].shareBps = v
  })
  return {
    liquidCash: {
      availableCashCents: accounts.filter((a) => a.type === 'checking' || a.type === 'savings').reduce((s, a) => s + a.balanceCents, 0),
      includedInPortfolio: false,
      note: 'Checking + savings. Pays bills and is never counted in the long-term portfolio total.',
    },
    totalLongTermCents: groups.reduce((s, g) => s + g.totalCents, 0),
    groups,
    accounts: longTerm.map((a) => {
      const riskLevel = a.riskLevel || DEFAULT_RISK_BY_TYPE[a.type]
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        group: groupOf(a.type),
        balanceCents: a.balanceCents,
        riskLevel,
        riskLabel: ACCOUNT_RISK_LEVELS[riskLevel]?.label ?? null,
        riskNote: ACCOUNT_RISK_LEVELS[riskLevel]?.note ?? null,
        riskIsAssumed: !a.riskLevel,
        annualRateBps: a.annualRateBps ?? null,
        maturityDate: a.maturityDate ?? null,
        daysToMaturity: a.maturityDate ? daysBetween(asOf, a.maturityDate) : null,
        holdingsNote: a.holdingsNote ?? null,
        source: a.source,
      }
    }),
  }
}

const simpleInterestCents = (p, bps, months) => Math.round((p * bps * months) / (12 * 10_000))
const cdStatus = (days) => (days < 0 ? 'matured' : days <= CD_RULES.dueSoonDays ? 'due_soon' : 'upcoming')
export const CD_ACTION_IDS = ['move_to_savings', 'renew_12', 'decide_later']

export function buildCdTimeline(accounts, asOf) {
  const cds = accounts.filter((a) => a.type === 'cd')
  const dated = cds
    .filter((a) => a.maturityDate)
    .map((a) => {
      const daysToMaturity = daysBetween(asOf, a.maturityDate)
      return {
        accountId: a.id,
        name: a.name,
        principalCents: a.balanceCents,
        annualRateBps: a.annualRateBps ?? null,
        maturityDate: a.maturityDate,
        daysToMaturity,
        reminderDate: addDays(a.maturityDate, -CD_RULES.reminderLeadDays),
        status: cdStatus(daysToMaturity),
        options: [
          { id: 'move_to_savings', label: 'Move to high-yield savings', description: 'Principal would become spendable cash from the maturity date (requires your approval; nothing moves automatically).', addsToAvailableCashCents: a.balanceCents, effectiveDate: a.maturityDate },
          { id: 'renew_12', label: `Renew for ${CD_RULES.renewalMonths} months`, description: 'Money stays locked for another term at a hypothetical rate.', hypotheticalRateBps: CD_RULES.hypotheticalRenewalRateBps, estimatedInterestCents: simpleInterestCents(a.balanceCents, CD_RULES.hypotheticalRenewalRateBps, CD_RULES.renewalMonths), addsToAvailableCashCents: 0 },
          { id: 'decide_later', label: 'Decide closer to the date', description: 'No change now; the reminder stays open.', addsToAvailableCashCents: 0 },
        ],
        source: a.source,
      }
    })
    .sort((x, y) => x.maturityDate.localeCompare(y.maturityDate))
  return { cds: dated, undatedCds: cds.filter((a) => !a.maturityDate).map((a) => ({ accountId: a.id, name: a.name, principalCents: a.balanceCents })) }
}
