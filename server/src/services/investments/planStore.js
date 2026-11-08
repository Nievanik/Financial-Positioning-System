/**
 * TEMPORARY IN-MEMORY STORE for proposed investment plans and CD decisions (engineering.md 10.4).
 * Lives in this Node process only: everything resets when the server restarts or redeploys, and it is
 * shared by every viewer of a profile. Nothing here changes balances or executes anything.
 */
import { randomUUID } from 'node:crypto'

export const STORAGE_INFO = Object.freeze({
  type: 'memory',
  resetsOnRestart: true,
  note: 'Saved plans and decisions are kept in server memory for this demo only and reset when the server restarts.',
})

const byProfile = new Map()

function bucket(slug) {
  if (!byProfile.has(slug)) byProfile.set(slug, { plans: [], cdDecisions: new Map() })
  return byProfile.get(slug)
}

export const listPlans = (slug) => bucket(slug).plans.map((p) => ({ ...p }))
export const countPlans = (slug) => bucket(slug).plans.length
export const findPlan = (slug, id) => bucket(slug).plans.find((p) => p.id === id) || null

export function addPlan(slug, plan) {
  const stored = { ...plan, id: `plan_${randomUUID()}`, createdAt: new Date().toISOString() }
  bucket(slug).plans.unshift(stored)
  return { ...stored }
}

export function updatePlan(slug, id, patch) {
  const plan = findPlan(slug, id)
  if (!plan) return null
  Object.assign(plan, patch)
  return { ...plan }
}

export function removePlan(slug, id) {
  const b = bucket(slug)
  const before = b.plans.length
  b.plans = b.plans.filter((p) => p.id !== id)
  return b.plans.length < before
}

export const getCdDecision = (slug, accountId) => bucket(slug).cdDecisions.get(accountId) || null
export function setCdDecision(slug, accountId, decision) {
  bucket(slug).cdDecisions.set(accountId, decision)
  return { ...decision }
}
export const clearCdDecision = (slug, accountId) => bucket(slug).cdDecisions.delete(accountId)

/** Test helper and the effect of a server restart. */
export function resetStore() {
  byProfile.clear()
}
