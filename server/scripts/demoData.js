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
    // Demo story 1 — "simple": one modest paycheck, rent + 2 bills, no loans, card paid in full. Easy-to-read sawtooth forecast.
    slug: 'steady-saver',
    expect: 'simple: no loans, no carried card balance, no shortfall, cash grows slowly each month',
    first: 'Maya', last: 'Chen',
    checking: 1800, savings: 3200, card: { balance: 0, limit: 2000 },
    pay: { frequency: 'biweekly', anchor: '2026-11-06', net: 1200, gross: 1500 },
    bills: [
      { payee: 'Oakview Apartments', nickname: 'Rent', day: 1, amount: 1050, category: 'housing' },
      { payee: 'Oncor Electric', nickname: 'Electric', day: 5, amount: 90, category: 'utilities' },
      { payee: 'StreamFlix', nickname: 'Streaming', day: 15, amount: 15, category: 'subscriptions' },
    ],
    loans: [],
    cardPayment: null, // pays the card in full: card purchases are already in variable spend, so no separate payment flow
    savingsTransfer: { day: 3, amount: 200 },
    spend: { groceries: 300, dining: 100, transport: 80, entertainment: 50 },
    supplemental: {
      retirement401kCents: 900000,
      // Investment Planner holdings (engineering.md section 10). Synthetic only: Nessie has no CD/brokerage accounts.
      investments: [
        { key: 'brokerage', name: 'Index Brokerage', type: 'investment', balanceCents: 180000, riskLevel: 'high', holdingsNote: 'S&P 500 index ETF' },
        { key: 'cd-6m', name: '6-Month CD', type: 'cd', balanceCents: 150000, riskLevel: 'low', annualRateBps: 410, maturityDate: '2026-12-12' },
        { key: 'cd-12m', name: '12-Month CD', type: 'cd', balanceCents: 250000, riskLevel: 'low', annualRateBps: 425, maturityDate: '2027-02-15' },
      ],
    },
  },
  {
    // Demo story 2 — "loans + recurring payments": two loans, a carried card balance and many monthly bills.
    // No overdraft, but about a quarter of gross pay goes to debt and the monthly margin is thin.
    slug: 'debt-heavy',
    expect: 'loans + recurring: debt burden above 25%, many recurring payments, thin margin, no shortfall',
    first: 'Jordan', last: 'Rivera',
    checking: 1600, savings: 1200, card: { balance: 3200, limit: 6000 },
    pay: { frequency: 'biweekly', anchor: '2026-11-04', net: 1500, gross: 1900 },
    bills: [
      { payee: 'Maple Court Rentals', nickname: 'Rent', day: 1, amount: 1000, category: 'housing' },
      { payee: 'Oncor Electric', nickname: 'Electric', day: 6, amount: 120, category: 'utilities' },
      { payee: 'T-Mobile', nickname: 'Phone', day: 11, amount: 70, category: 'utilities' },
      { payee: 'State Farm', nickname: 'Car insurance', day: 14, amount: 130, category: 'transport' },
      { payee: 'StreamFlix', nickname: 'Streaming', day: 16, amount: 25, category: 'subscriptions' },
      { payee: 'FitLife Gym', nickname: 'Gym', day: 21, amount: 40, category: 'subscriptions' },
    ],
    loans: [
      { name: 'Auto loan', type: 'auto', outstanding: 13500, payment: 450, day: 9, rateBps: 690, creditScore: 660 },
      { name: 'Student loan', type: 'student', outstanding: 21000, payment: 300, day: 20, rateBps: 550, creditScore: 660 },
    ],
    cardPayment: { day: 24, amount: 320 },
    savingsTransfer: { day: 3, amount: 50 },
    spend: { groceries: 350, dining: 120, transport: 90, entertainment: 40 },
    supplemental: {
      retirement401kCents: 350000,
      investments: [
        { key: 'cd-6m', name: '6-Month CD', type: 'cd', balanceCents: 150000, riskLevel: 'low', annualRateBps: 390, maturityDate: '2026-12-28' },
      ],
    },
  },
  {
    // Demo story 3 — "cash crunch": paid once a month (28th) while rent, loan and card payments land earlier,
    // so checking dips below $0 for about a week before each payday even though every month-end is positive.
    slug: 'cash-crunch',
    expect: 'cash shortfall: a short dip below $0 before each payday; month-ends stay positive',
    first: 'Sam', last: 'Okafor',
    checking: 700, savings: 100, card: { balance: 2200, limit: 4000 },
    pay: { frequency: 'monthly', anchor: '2026-10-28', net: 3200, gross: 4000 },
    bills: [
      { payee: 'Brookline Towers', nickname: 'Rent', day: 1, amount: 1400, category: 'housing' },
      { payee: 'Oncor Electric', nickname: 'Electric', day: 5, amount: 150, category: 'utilities' },
      { payee: 'State Farm', nickname: 'Car insurance', day: 10, amount: 180, category: 'transport' },
      { payee: 'StreamFlix', nickname: 'Streaming', day: 12, amount: 30, category: 'subscriptions' },
    ],
    loans: [{ name: 'Auto loan', type: 'auto', outstanding: 11000, payment: 380, day: 15, rateBps: 780, creditScore: 690 }],
    cardPayment: { day: 20, amount: 250 },
    savingsTransfer: { day: 28, amount: 20 },
    spend: { groceries: 400, dining: 160, transport: 110, entertainment: 60 },
    supplemental: {
      retirement401kCents: 120000,
      investments: [
        { key: 'micro-invest', name: 'Micro-investing App', type: 'investment', balanceCents: 45000, riskLevel: 'high', holdingsNote: 'Round-up ETF portfolio' },
        { key: 'cd-9m', name: '9-Month CD', type: 'cd', balanceCents: 200000, riskLevel: 'low', annualRateBps: 410, maturityDate: '2026-12-20' },
      ],
    },
  },
];
