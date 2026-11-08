/**
 * Investment Planner use cases (docs/engineering.md section 10). Calculations come from engine/investments;
 * this layer resolves the profile snapshot, applies the in-memory plan store, and shapes JSON responses.
 * Nothing here moves money or modifies financial records; every decision reports executed: false.
 *
 * Holdings are read from MongoDB through services/snapshot.js `loadSnapshot` (the same data the Dashboard
 * overview uses), so balances, names and dates always match. `loadSnapshot` is injectable for tests.
 */
import {
  ALLOCATION_PRESETS,
  ASSET_CLASSES,
  buildCdTimeline,
  buildPortfolio,
  CD_RULES,
  DISCLAIMER,
  LIMITS,
  RETURN_SCENARIOS,
  RISK_BANDS,
  simulateAllocation,
} from '../../engine/investments/index.js'
import { httpError } from '../../middleware/errorHandler.js'
import * as store from './planStore.js'

/** Mongo account document -> engine holding (string id, optional supplemental metadata). */
export const toHolding = (a) => ({
  id: String(a._id ?? a.id),
  name: a.name,
  type: a.type,
  balanceCents: a.balanceCents,
  riskLevel: a.riskLevel ?? null,
  annualRateBps: a.annualRateBps ?? null,
  maturityDate: a.maturityDate ?? null,
  holdingsNote: a.holdingsNote ?? null,
  source: a.source,
})

export function getAssumptions() {
  return {
    label: 'Hypothetical',
    assetClasses: ASSET_CLASSES,
    returnScenarios: RETURN_SCENARIOS,
    presets: ALLOCATION_PRESETS,
    riskBands: RISK_BANDS.map((b) => ({ id: b.id, label: b.label, belowBps: Number.isFinite(b.belowBps) ? b.belowBps : null })),
    cdRules: CD_RULES,
    limits: LIMITS,
    disclaimer: DISCLAIMER,
  }
}

const assumptionsEcho = () => ({ label: 'Hypothetical', assetClasses: ASSET_CLASSES, returnScenarios: RETURN_SCENARIOS })

function presetLabel(allocation) {
  return ALLOCATION_PRESETS.find((p) => ASSET_CLASSES.every((a) => p.allocation[a.id] === allocation[a.id]))?.label ?? 'Custom'
}

/** @param {{ loadSnapshot: (slug: string) => Promise<{ profile, asOf, accounts }> }} deps */
export function createInvestmentService({ loadSnapshot }) {
  async function holdings(slug) {
    const snap = await loadSnapshot(slug) // 404 PROFILE_NOT_FOUND for unknown slugs
    return {
      profile: { slug: snap.profile.slug, displayName: snap.profile.displayName },
      asOf: snap.asOf,
      accounts: snap.accounts.map(toHolding),
    }
  }

  async function requireCd(slug, accountId) {
    const { accounts } = await holdings(slug)
    if (!accounts.some((a) => a.id === accountId && a.type === 'cd')) {
      throw httpError(404, 'CD_NOT_FOUND', 'No CD with that account id for this profile.')
    }
  }

  return {
    getAssumptions,

    async getPortfolio(slug) {
      const h = await holdings(slug)
      return { profile: h.profile, asOf: h.asOf, ...buildPortfolio(h), disclaimer: DISCLAIMER }
    },

    async getCds(slug) {
      const h = await holdings(slug)
      const timeline = buildCdTimeline(h.accounts, h.asOf)
      return {
        asOf: h.asOf,
        reminderLeadDays: CD_RULES.reminderLeadDays,
        cds: timeline.cds.map((cd) => ({ ...cd, decision: store.getCdDecision(slug, cd.accountId) })),
        undatedCds: timeline.undatedCds,
        storage: store.STORAGE_INFO,
        disclaimer: DISCLAIMER,
      }
    },

    async simulate(slug, input) {
      await holdings(slug)
      return { ...simulateAllocation(input), assumptions: assumptionsEcho(), disclaimer: DISCLAIMER }
    },

    async listPlans(slug) {
      await holdings(slug)
      return { plans: store.listPlans(slug), storage: store.STORAGE_INFO }
    },

    async savePlan(slug, input) {
      await holdings(slug)
      if (store.countPlans(slug) >= LIMITS.maxPlansPerProfile) {
        throw httpError(422, 'PLAN_LIMIT_REACHED', `At most ${LIMITS.maxPlansPerProfile} proposed plans per profile. Remove one first.`)
      }
      const sim = simulateAllocation(input)
      const plan = store.addPlan(slug, {
        name: input.name || `Proposed plan (${presetLabel(input.allocation)})`,
        status: 'pending',
        allocation: sim.input.allocation,
        amountCents: sim.input.amountCents,
        years: sim.input.years,
        risk: sim.risk,
        scenarios: sim.scenarios,
        decidedAt: null,
        executed: false,
      })
      return { plan, storage: store.STORAGE_INFO }
    },

    async decidePlan(slug, planId, decision) {
      await holdings(slug)
      const plan = store.findPlan(slug, planId)
      if (!plan) throw httpError(404, 'PLAN_NOT_FOUND', 'No proposed plan with that id (plans reset when the server restarts).')
      if (plan.status !== 'pending') {
        throw httpError(409, 'PLAN_ALREADY_DECIDED', `This plan was already ${plan.status}.`, { status: plan.status })
      }
      const updated = store.updatePlan(slug, planId, { status: decision, decidedAt: new Date().toISOString(), executed: false })
      return { plan: updated, storage: store.STORAGE_INFO }
    },

    async removePlan(slug, planId) {
      await holdings(slug)
      if (!store.removePlan(slug, planId)) throw httpError(404, 'PLAN_NOT_FOUND', 'No proposed plan with that id.')
      return { removed: true, storage: store.STORAGE_INFO }
    },

    async decideCd(slug, accountId, { action, decision }) {
      await requireCd(slug, accountId)
      const saved = store.setCdDecision(slug, accountId, { accountId, action, decision, decidedAt: new Date().toISOString(), executed: false })
      return { decision: saved, storage: store.STORAGE_INFO }
    },

    async clearCd(slug, accountId) {
      await requireCd(slug, accountId)
      store.clearCdDecision(slug, accountId)
      return { removed: true, storage: store.STORAGE_INFO }
    },
  }
}
