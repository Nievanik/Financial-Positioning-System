/** Pure CD maturity calculations: days to maturity, reminder date, status and hypothetical options. */
import { CD_RULES } from './assumptions.js'
import { addDays, daysBetween } from './dates.js'

/** Simple (non-compounding) interest in integer cents — illustration only. */
export function simpleInterestCents(principalCents, rateBps, months) {
  return Math.round((principalCents * rateBps * months) / (12 * 10_000))
}

export function cdStatus(daysToMaturity, rules = CD_RULES) {
  if (daysToMaturity < 0) return 'matured'
  if (daysToMaturity <= rules.dueSoonDays) return 'due_soon'
  return 'upcoming'
}

export function cdOptions(cd, rules = CD_RULES) {
  return [
    {
      id: 'move_to_savings',
      label: 'Move to high-yield savings',
      description: 'Principal would become spendable cash from the maturity date (requires your approval; nothing moves automatically).',
      addsToAvailableCashCents: cd.balanceCents,
      effectiveDate: cd.maturityDate,
    },
    {
      id: 'renew_12',
      label: `Renew for ${rules.renewalMonths} months`,
      description: 'Money stays locked for another term at a hypothetical rate.',
      hypotheticalRateBps: rules.hypotheticalRenewalRateBps,
      estimatedInterestCents: simpleInterestCents(cd.balanceCents, rules.hypotheticalRenewalRateBps, rules.renewalMonths),
      addsToAvailableCashCents: 0,
    },
    {
      id: 'decide_later',
      label: 'Decide closer to the date',
      description: 'No change now; the reminder stays open.',
      addsToAvailableCashCents: 0,
    },
  ]
}

export const CD_ACTION_IDS = Object.freeze(['move_to_savings', 'renew_12', 'decide_later'])

/** Timeline entries for dated CDs (sorted by maturity) plus a list of undated CDs. */
export function buildCdTimeline(accounts, asOf, rules = CD_RULES) {
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
        reminderDate: addDays(a.maturityDate, -rules.reminderLeadDays),
        status: cdStatus(daysToMaturity, rules),
        options: cdOptions(a, rules),
        source: a.source,
      }
    })
    .sort((x, y) => x.maturityDate.localeCompare(y.maturityDate))
  const undated = cds.filter((a) => !a.maturityDate).map((a) => ({ accountId: a.id, name: a.name, principalCents: a.balanceCents }))
  return { cds: dated, undatedCds: undated }
}
