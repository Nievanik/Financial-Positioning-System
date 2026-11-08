// Fictional demo customers (all synthetic). Amounts are WHOLE DOLLARS (Nessie's unit); the seed converts to cents for the engine.
// Tuning rule: after editing numbers, run `npm run seed` (dry-run) and confirm each profile's printed outcome still matches its `expect`.
export const ASOF = '2026-11-08'; // frozen snapshot date; every nextDate is derived from this, never from the real clock
export const HISTORY_DAYS = 91; // ~3 months of back-dated history

// Merchant ids from the shared Nessie sandbox (resolved by exact name+category on 2026-11-08; ids are stable).
export const MERCHANTS = {
  groceries: { id: '01527be6-87a6-427f-85f7-bbacefde95ac', name: 'Kroger' },
  dining: { id: '0393b2bd-29c5-48cc-9872-764101aa91f8', name: 'Chipotle' },
  transport: { id: '02833f55-8589-44ce-b15b-f9d71bb2f701', name: 'Shell' },
  entertainment: { id: '77c1c372-3208-4bdc-a379-ac0995bb26e7', name: 'Arcade Alley' },
};

export const PROFILES = [
  {
    slug: 'steady-saver',
    expect: 'healthy: no shortfall, positive net cash flow',
    first: 'Maya', last: 'Chen',
    checking: 3500, savings: 14000, card: { balance: 300, limit: 6000 },
    pay: { frequency: 'biweekly', anchor: '2026-11-06', net: 1600, gross: 2000 },
    bills: [
      { payee: 'Oakview Apartments', nickname: 'Rent', day: 1, amount: 1100, category: 'housing' },
      { payee: 'Oncor Electric', nickname: 'Electric', day: 5, amount: 140, category: 'utilities' },
      { payee: 'State Farm', nickname: 'Car insurance', day: 12, amount: 120, category: 'transport' },
      { payee: 'StreamFlix', nickname: 'Streaming', day: 15, amount: 35, category: 'subscriptions' },
    ],
    loans: [{ name: 'Auto loan', type: 'auto', outstanding: 6000, payment: 220, day: 18, rateBps: 520, creditScore: 780 }],
    cardPayment: { day: 25, amount: 300 },
    savingsTransfer: { day: 3, amount: 300 },
    spend: { groceries: 380, dining: 150, transport: 100, entertainment: 80 },
    supplemental: {
      retirement401kCents: 2800000,
      // Investment Planner holdings (engineering.md section 10). Synthetic only: Nessie has no CD/brokerage accounts.
      investments: [
        { key: 'brokerage', name: 'Index Brokerage', type: 'investment', balanceCents: 420000, riskLevel: 'high', holdingsNote: 'S&P 500 + international index ETFs' },
        { key: 'cd-6m', name: '6-Month CD', type: 'cd', balanceCents: 250000, riskLevel: 'low', annualRateBps: 410, maturityDate: '2026-12-12' },
        { key: 'cd-12m', name: '12-Month CD', type: 'cd', balanceCents: 500000, riskLevel: 'low', annualRateBps: 425, maturityDate: '2027-02-15' },
      ],
    },
  },
  {
    slug: 'debt-heavy',
    expect: 'debt pressure: debt burden near 30%, thin cash, a brief shortfall late in the horizon',
    first: 'Jordan', last: 'Rivera',
    checking: 1800, savings: 600, card: { balance: 6500, limit: 8000 },
    pay: { frequency: 'biweekly', anchor: '2026-11-04', net: 1300, gross: 1650 },
    bills: [
      { payee: 'Maple Court Rentals', nickname: 'Rent', day: 1, amount: 1000, category: 'housing' },
      { payee: 'Oncor Electric', nickname: 'Electric', day: 6, amount: 160, category: 'utilities' },
      { payee: 'State Farm', nickname: 'Car insurance', day: 14, amount: 140, category: 'transport' },
      { payee: 'StreamFlix', nickname: 'Streaming', day: 16, amount: 60, category: 'subscriptions' },
    ],
    loans: [
      { name: 'Auto loan', type: 'auto', outstanding: 14000, payment: 410, day: 9, rateBps: 910, creditScore: 640 },
      { name: 'Student loan', type: 'student', outstanding: 22000, payment: 280, day: 20, rateBps: 560, creditScore: 640 },
    ],
    cardPayment: { day: 22, amount: 350 },
    savingsTransfer: { day: 3, amount: 25 },
    spend: { groceries: 420, dining: 170, transport: 110, entertainment: 50 },
    supplemental: {
      retirement401kCents: 350000,
      investments: [
        { key: 'cd-6m', name: '6-Month CD', type: 'cd', balanceCents: 150000, riskLevel: 'low', annualRateBps: 390, maturityDate: '2026-12-28' },
      ],
    },
  },
  {
    slug: 'cash-crunch',
    expect: 'cash shortfall: a day below $0 appears within the 6-month horizon',
    first: 'Sam', last: 'Okafor',
    checking: 900, savings: 150, card: { balance: 2200, limit: 4000 },
    pay: { frequency: 'monthly', anchor: '2026-10-28', net: 3000, gross: 3700 },
    bills: [
      { payee: 'Brookline Towers', nickname: 'Rent', day: 1, amount: 1400, category: 'housing' },
      { payee: 'Oncor Electric', nickname: 'Electric', day: 5, amount: 180, category: 'utilities' },
      { payee: 'State Farm', nickname: 'Car insurance', day: 10, amount: 200, category: 'transport' },
      { payee: 'StreamFlix', nickname: 'Streaming', day: 12, amount: 50, category: 'subscriptions' },
    ],
    loans: [{ name: 'Auto loan', type: 'auto', outstanding: 11000, payment: 380, day: 15, rateBps: 780, creditScore: 690 }],
    cardPayment: { day: 20, amount: 300 },
    savingsTransfer: { day: 28, amount: 20 },
    spend: { groceries: 420, dining: 180, transport: 120, entertainment: 80 },
    supplemental: {
      retirement401kCents: 120000,
      investments: [
        { key: 'micro-invest', name: 'Micro-investing App', type: 'investment', balanceCents: 45000, riskLevel: 'high', holdingsNote: 'Round-up ETF portfolio' },
        { key: 'cd-9m', name: '9-Month CD', type: 'cd', balanceCents: 200000, riskLevel: 'low', annualRateBps: 410, maturityDate: '2026-12-20' },
      ],
    },
  },
];
