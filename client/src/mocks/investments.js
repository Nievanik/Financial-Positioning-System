/**
 * MOCK investment routes (same paths, shapes and errors as server/src/routes/investments.routes.js).
 * Plans and CD decisions live in this browser tab's memory and reset on page reload.
 */
import { ApiError } from '@/lib/apiError'
import {
  ALLOCATION_PRESETS,
  ASSET_CLASSES,
  ASSET_CLASS_IDS,
  allocationTotal,
  assumptionsPayload,
  buildCdTimeline,
  buildPortfolio,
  CD_ACTION_IDS,
  DISCLAIMER,
  LIMITS,
  RETURN_SCENARIOS,
  simulateAllocation,
} from './investmentEngine'

const STORAGE = {
  type: 'memory',
  resetsOnRestart: true,
  note: 'Mock mode: saved plans and decisions live in this browser tab and reset when the page reloads.',
}
const store = new Map()
const bucket = (slug) => {
  if (!store.has(slug)) store.set(slug, { plans: [], cd: {} })
  return store.get(slug)
}

const fail = (field, message) => {
  throw new ApiError(400, 'VALIDATION_FAILED', message, { field })
}

function parseSim(b) {
  if (!b || typeof b !== 'object') fail('body', 'A JSON object body is required.')
  const { allocation, amountCents, years } = b
  if (!allocation || typeof allocation !== 'object') fail('allocation', 'allocation must be an object.')
  if (Object.keys(allocation).some((k) => !ASSET_CLASS_IDS.includes(k))) fail('allocation', 'Unknown asset classes.')
  for (const id of ASSET_CLASS_IDS) {
    if (!Number.isInteger(allocation[id]) || allocation[id] < 0 || allocation[id] > 100) fail(`allocation.${id}`, `allocation.${id} must be an integer from 0 to 100.`)
  }
  if (allocationTotal(allocation) !== 100) fail('allocation', `Allocation must total exactly 100 (got ${allocationTotal(allocation)}).`)
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > LIMITS.maxAmountCents) fail('amountCents', 'amountCents must be a positive integer.')
  if (!Number.isInteger(years) || years < LIMITS.minYears || years > LIMITS.maxYears) fail('years', 'years must be an integer from 1 to 30.')
  return { allocation: Object.fromEntries(ASSET_CLASS_IDS.map((id) => [id, allocation[id]])), amountCents, years }
}

const presetLabel = (a) => ALLOCATION_PRESETS.find((p) => ASSET_CLASSES.every((c) => p.allocation[c.id] === a[c.id]))?.label ?? 'Custom'

/**
 * @param holdings `{ slug, displayName, asOf, accounts }` built from the mock overview (same data as the Dashboard)
 * @returns the response, or undefined when the path is not an investment route
 */
export function investmentMockRoute(holdings, route, method, body) {
  const slug = holdings.slug
  const snap = { accounts: holdings.accounts, asOf: holdings.asOf }
  const parts = route.split('/') // ['investments', ...]
  const b = bucket(slug)

  if (method === 'GET' && route === 'investments/portfolio') {
    return { profile: { slug, displayName: holdings.displayName }, asOf: snap.asOf, ...buildPortfolio(snap), disclaimer: DISCLAIMER }
  }
  if (method === 'GET' && route === 'investments/cds') {
    const t = buildCdTimeline(snap.accounts, snap.asOf)
    return { asOf: snap.asOf, reminderLeadDays: 14, cds: t.cds.map((c) => ({ ...c, decision: b.cd[c.accountId] || null })), undatedCds: t.undatedCds, storage: STORAGE, disclaimer: DISCLAIMER }
  }
  if (method === 'POST' && route === 'investments/allocations/simulate') {
    return { ...simulateAllocation(parseSim(body)), assumptions: { label: 'Hypothetical', assetClasses: ASSET_CLASSES, returnScenarios: RETURN_SCENARIOS }, disclaimer: DISCLAIMER }
  }
  if (route === 'investments/plans') {
    if (method === 'GET') return { plans: b.plans.map((p) => ({ ...p })), storage: STORAGE }
    if (method === 'POST') {
      const input = parseSim(body)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (name.length > LIMITS.maxPlanName) fail('name', 'name is too long.')
      if (b.plans.length >= LIMITS.maxPlansPerProfile) throw new ApiError(422, 'PLAN_LIMIT_REACHED', 'Too many proposed plans. Remove one first.')
      const sim = simulateAllocation(input)
      const plan = {
        id: `plan_mock_${Date.now()}_${b.plans.length}`,
        name: name || `Proposed plan (${presetLabel(input.allocation)})`,
        status: 'pending',
        ...sim.input,
        risk: sim.risk,
        scenarios: sim.scenarios,
        createdAt: new Date().toISOString(),
        decidedAt: null,
        executed: false,
      }
      b.plans.unshift(plan)
      return { plan: { ...plan }, storage: STORAGE }
    }
  }
  if (parts[1] === 'plans' && parts[2]) {
    const plan = b.plans.find((p) => p.id === decodeURIComponent(parts[2]))
    if (!plan) throw new ApiError(404, 'PLAN_NOT_FOUND', 'No proposed plan with that id.')
    if (method === 'DELETE' && parts.length === 3) {
      b.plans = b.plans.filter((p) => p !== plan)
      return { removed: true, storage: STORAGE }
    }
    if (method === 'POST' && parts[3] === 'decision') {
      if (!['approved', 'rejected'].includes(body?.decision)) fail('decision', 'decision must be "approved" or "rejected".')
      if (plan.status !== 'pending') throw new ApiError(409, 'PLAN_ALREADY_DECIDED', `This plan was already ${plan.status}.`, { status: plan.status })
      Object.assign(plan, { status: body.decision, decidedAt: new Date().toISOString(), executed: false })
      return { plan: { ...plan }, storage: STORAGE }
    }
  }
  if (parts[1] === 'cds' && parts[2] && parts[3] === 'decision') {
    const id = decodeURIComponent(parts[2])
    if (!holdings.accounts.some((a) => a.id === id && a.type === 'cd')) throw new ApiError(404, 'CD_NOT_FOUND', 'No CD with that account id for this profile.')
    if (method === 'DELETE') {
      delete b.cd[id]
      return { removed: true, storage: STORAGE }
    }
    if (method === 'POST') {
      if (!CD_ACTION_IDS.includes(body?.action)) fail('action', `action must be one of: ${CD_ACTION_IDS.join(', ')}.`)
      if (!['approved', 'rejected'].includes(body?.decision)) fail('decision', 'decision must be "approved" or "rejected".')
      b.cd[id] = { accountId: id, action: body.action, decision: body.decision, decidedAt: new Date().toISOString(), executed: false }
      return { decision: { ...b.cd[id] }, storage: STORAGE }
    }
  }
  return undefined
}

export { assumptionsPayload }
