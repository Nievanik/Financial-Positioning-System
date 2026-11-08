/** Request validation for the Investment Planner routes (engineering.md 10.2). Throws 400 VALIDATION_FAILED. */
import { ASSET_CLASS_IDS, isValidAllocation, allocationTotal, CD_ACTION_IDS, LIMITS } from '../engine/investments/index.js'
import { httpError } from '../middleware/errorHandler.js'

const fail = (field, message, extra = {}) => {
  throw httpError(400, 'VALIDATION_FAILED', message, { field, ...extra })
}

function body(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) fail('body', 'A JSON object body is required.')
  return req.body
}

export function parseSimulationInput(req) {
  const b = body(req)
  const { allocation, amountCents, years } = b
  if (!allocation || typeof allocation !== 'object' || Array.isArray(allocation)) fail('allocation', 'allocation must be an object.')
  const unknown = Object.keys(allocation).filter((k) => !ASSET_CLASS_IDS.includes(k))
  if (unknown.length) fail('allocation', `Unknown asset classes: ${unknown.join(', ')}.`, { allowed: ASSET_CLASS_IDS })
  for (const id of ASSET_CLASS_IDS) {
    const v = allocation[id]
    if (!Number.isInteger(v) || v < 0 || v > 100) fail(`allocation.${id}`, `allocation.${id} must be an integer from 0 to 100.`)
  }
  if (!isValidAllocation(allocation)) fail('allocation', `Allocation must total exactly 100 (got ${allocationTotal(allocation)}).`)
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || amountCents > LIMITS.maxAmountCents) {
    fail('amountCents', `amountCents must be a positive integer up to ${LIMITS.maxAmountCents}.`)
  }
  if (!Number.isInteger(years) || years < LIMITS.minYears || years > LIMITS.maxYears) {
    fail('years', `years must be an integer from ${LIMITS.minYears} to ${LIMITS.maxYears}.`)
  }
  const allocationClean = Object.fromEntries(ASSET_CLASS_IDS.map((id) => [id, allocation[id]]))
  return { allocation: allocationClean, amountCents, years }
}

export function parsePlanInput(req) {
  const input = parseSimulationInput(req)
  const { name } = req.body
  if (name !== undefined && name !== null && typeof name !== 'string') fail('name', 'name must be a string.')
  const trimmed = (name || '').trim()
  if (trimmed.length > LIMITS.maxPlanName) fail('name', `name must be at most ${LIMITS.maxPlanName} characters.`)
  return { ...input, name: trimmed }
}

export function parsePlanDecision(req) {
  const { decision } = body(req)
  if (!['approved', 'rejected'].includes(decision)) fail('decision', 'decision must be "approved" or "rejected".')
  return decision
}

export function parseCdDecision(req) {
  const { action, decision } = body(req)
  if (!CD_ACTION_IDS.includes(action)) fail('action', `action must be one of: ${CD_ACTION_IDS.join(', ')}.`)
  if (!['approved', 'rejected'].includes(decision)) fail('decision', 'decision must be "approved" or "rejected".')
  return { action, decision }
}
