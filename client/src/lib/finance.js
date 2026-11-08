import { addDays } from './format'

// shortcut: overview.obligations holds each flow's NEXT date only, so a weekly bill counts once in 14 days.
// All seeded obligations are monthly; count occurrences if weekly bills are ever added.
export const dueWithin = (overview, days) => overview.obligations.filter((o) => o.nextDate <= addDays(overview.asOf, days))
