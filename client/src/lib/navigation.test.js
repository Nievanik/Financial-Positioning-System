// Banking navigation helpers (docs/design.md section 3). Pure; run with `npm test`.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeSection, creditCardTarget, defaultAccount, loanPaymentFlow, profilePath, SECTIONS, switchProfilePath } from './navigation.js'

test('sections: five items in two groups, sidebar order', () => {
  assert.deepEqual(SECTIONS.map((s) => s.id), ['overview', 'accounts', 'loans', 'simulate', 'investments'])
  assert.deepEqual([...new Set(SECTIONS.map((s) => s.group))], ['Banking', 'Planning'])
})

test('profilePath builds slug-scoped routes', () => {
  assert.equal(profilePath('debt-heavy'), '/p/debt-heavy')
  assert.equal(profilePath('debt-heavy', 'loans'), '/p/debt-heavy/loans')
  assert.equal(profilePath('debt-heavy', 'accounts', 'abc123'), '/p/debt-heavy/accounts/abc123')
})

test('activeSection: Accounts stays active on an account detail route', () => {
  assert.equal(activeSection('/p/s', 's'), 'overview')
  assert.equal(activeSection('/p/s/', 's'), 'overview')
  assert.equal(activeSection('/p/s/accounts', 's'), 'accounts')
  assert.equal(activeSection('/p/s/accounts/123', 's'), 'accounts')
  assert.equal(activeSection('/p/s/loans', 's'), 'loans')
  assert.equal(activeSection('/p/s/simulate', 's'), 'simulate')
  assert.equal(activeSection('/p/s/investments', 's'), 'investments')
  assert.equal(activeSection('/p/s/nope', 's'), null)
})

test('switchProfilePath keeps the section and query, but never carries an account id across customers', () => {
  assert.equal(switchProfilePath('/p/a', 'a', 'b'), '/p/b')
  assert.equal(switchProfilePath('/p/a/loans', 'a', 'b', '?mock=1'), '/p/b/loans?mock=1')
  assert.equal(switchProfilePath('/p/a/simulate', 'a', 'b'), '/p/b/simulate')
  assert.equal(switchProfilePath('/p/a/investments', 'a', 'b'), '/p/b/investments')
  assert.equal(switchProfilePath('/p/a/accounts', 'a', 'b'), '/p/b/accounts')
  assert.equal(switchProfilePath('/p/a/accounts/acct-of-a', 'a', 'b', '?mock=1'), '/p/b/accounts?mock=1')
  assert.equal(switchProfilePath('/p/a/unknown/x', 'a', 'b'), '/p/b')
  assert.equal(switchProfilePath('/', undefined, 'b'), '/p/b')
})

test('loanPaymentFlow matches by loanId, falls back to name only for flows without loanId', () => {
  const obligations = [
    { kind: 'bill', name: 'Auto loan', nextDate: '2026-11-01', loanId: null },
    { kind: 'loan_payment', name: 'Auto loan', nextDate: '2026-11-09', amountCents: 41000, loanId: 'L2' },
    { kind: 'loan_payment', name: 'Student loan', nextDate: '2026-11-20', amountCents: 28000, loanId: 'L1' },
  ]
  assert.equal(loanPaymentFlow({ id: 'L1', name: 'Student loan' }, obligations).nextDate, '2026-11-20')
  assert.equal(loanPaymentFlow({ id: 'L2', name: 'Renamed' }, obligations).amountCents, 41000)
  assert.equal(loanPaymentFlow({ id: 'L9', name: 'Auto loan' }, obligations), null) // linked flows are never borrowed by name
  const legacy = [{ kind: 'loan_payment', name: 'Auto loan', nextDate: '2026-11-18' }] // mock fixture: no loanId
  assert.equal(loanPaymentFlow({ id: 'x', name: 'Auto loan' }, legacy).nextDate, '2026-11-18')
  assert.equal(loanPaymentFlow({ id: 'x', name: 'Other' }, legacy), null)
  assert.equal(loanPaymentFlow(null, legacy), null)
})

test('creditCardTarget and defaultAccount', () => {
  const accounts = [{ id: 'r', type: 'retirement' }, { id: 's', type: 'savings' }, { id: 'c', type: 'credit_card' }, { id: 'k', type: 'checking' }]
  assert.equal(creditCardTarget('p', accounts), '/p/p/accounts/c')
  assert.equal(creditCardTarget('p', [...accounts, { id: 'c2', type: 'credit_card' }]), '/p/p/accounts')
  assert.equal(creditCardTarget('p', []), '/p/p/accounts')
  assert.equal(defaultAccount(accounts).id, 'k')
  assert.equal(defaultAccount(accounts.filter((a) => a.type !== 'checking')).id, 's')
  assert.equal(defaultAccount([]), null)
})
