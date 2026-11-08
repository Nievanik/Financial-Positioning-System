/** Pure portfolio grouping: long-term holdings by group, kept separate from liquid cash. */
import { ACCOUNT_RISK_LEVELS, DEFAULT_RISK_BY_TYPE, PORTFOLIO_GROUPS } from './assumptions.js'
import { daysBetween } from './dates.js'

const CASH_TYPES = ['checking', 'savings']

/** Available cash = checking + savings only (engineering.md invariant). */
export function availableCashCents(accounts) {
  return accounts.filter((a) => CASH_TYPES.includes(a.type)).reduce((s, a) => s + a.balanceCents, 0)
}

/** Integer basis-point shares that sum to exactly 10000 (largest remainder). */
export function sharesBps(values) {
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

function groupOf(type) {
  return PORTFOLIO_GROUPS.find((g) => g.types.includes(type))?.id ?? null
}

export function buildPortfolio({ accounts, asOf }) {
  const longTerm = accounts.filter((a) => groupOf(a.type))
  const groups = PORTFOLIO_GROUPS.map((g) => {
    const items = longTerm.filter((a) => g.types.includes(a.type))
    return { id: g.id, label: g.label, totalCents: items.reduce((s, a) => s + a.balanceCents, 0), accountIds: items.map((a) => a.id) }
  }).filter((g) => g.accountIds.length > 0)
  const shares = sharesBps(groups.map((g) => g.totalCents))
  groups.forEach((g, i) => {
    g.shareBps = shares[i]
  })

  return {
    liquidCash: {
      availableCashCents: availableCashCents(accounts),
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
