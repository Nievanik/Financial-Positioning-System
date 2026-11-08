// Provider-neutral explanation adapter (docs/engineering.md section 4, rule 8).
// The model only receives already-computed facts and returns prose; it never produces numbers.
// No AI provider is chosen yet: `adapters` is the extension point (name -> async ({subject, facts, assumptions, warnings}) => string).
const money = (c) => `${c < 0 ? '-' : ''}${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(c) / 100)}`;
const DISCLAIMER = 'This is an estimate from synthetic demo data, not financial advice or a loan decision.';
const AI_TIMEOUT_MS = 8000;

export const adapters = {};

export function templateExplanation(subject, f) {
  if (subject === 'forecast') {
    const [a, , , d] = f.checkpoints;
    const risk = f.firstShortfallDate
      ? `Cash is projected to fall below ${money(f.cashFloorCents)} starting ${f.firstShortfallDate}, for ${f.daysBelowFloor} day(s), with a low of ${money(f.minCashCents)}.`
      : 'Cash is not projected to fall below the floor on any day.';
    return `As of ${f.asOf}, projected spendable cash (checking + savings) is ${money(a.cashCents)} on ${a.date} and ${money(d.cashCents)} on ${d.date}. ${risk} ${DISCLAIMER}`;
  }
  const delta = Object.entries(f.deltas).map(([k, v]) => `${k.replace('Cents', '').replace('month', 'month ')}: ${money(v)}`).join(', ');
  const risk = !f.firstShortfallDate ? 'It would not cause cash to fall below the floor.'
    : f.baselineFirstShortfallDate ? `Cash already falls below the floor starting ${f.baselineFirstShortfallDate}; with this change it starts ${f.firstShortfallDate}.`
      : `It would cause cash to fall below the floor starting ${f.firstShortfallDate}.`;
  const tip = f.topRecommendation ? ` Suggested action: ${f.topRecommendation.title} (${money(f.topRecommendation.impactMonth6Cents)} by month 6).` : '';
  return `Adding "${f.name}" changes projected cash by ${delta}. ${risk}${tip} ${DISCLAIMER}`;
}

export async function explain({ subject, facts, assumptions = [], warnings = [] }, { provider = process.env.AI_PROVIDER, registry = adapters } = {}) {
  const adapter = provider && provider !== 'none' ? registry[provider] : null;
  if (adapter) {
    try {
      const text = await Promise.race([
        adapter({ subject, facts, assumptions, warnings }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('AI timeout')), AI_TIMEOUT_MS).unref()),
      ]);
      if (typeof text === 'string' && text.trim()) return { text: text.trim(), method: 'ai' };
    } catch (err) {
      console.error('AI explanation failed, using template:', err.message); // never log facts/keys
    }
  }
  return { text: templateExplanation(subject, facts), method: 'template' };
}
