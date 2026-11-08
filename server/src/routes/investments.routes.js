// Investment Planner routes (docs/engineering.md section 10). Mounted at /api/v1 in app.js.
// Reads holdings via services/snapshot.js (read-only); plans/decisions live in server memory only.
// Nothing here writes to MongoDB or Nessie, places trades, or moves money.
import { Router } from 'express'
import { calcLimit } from '../middleware/rateLimit.js'
import { createInvestmentService } from '../services/investments/investmentService.js'
import { loadSnapshot } from '../services/snapshot.js'
import { parseCdDecision, parsePlanDecision, parsePlanInput, parseSimulationInput } from '../validators/investments.js'

/** Router factory; tests inject a fake `loadSnapshot` so they run without MongoDB. */
export function createInvestmentRouter({ loadSnapshot: load = loadSnapshot, limit = calcLimit } = {}) {
  const svc = createInvestmentService({ loadSnapshot: load })
  const router = Router()
  const base = '/profiles/:slug/investments'

  router.get('/investments/assumptions', (_req, res) => res.json(svc.getAssumptions()))

  router.get(`${base}/portfolio`, async (req, res) => res.json(await svc.getPortfolio(req.params.slug)))
  router.get(`${base}/cds`, async (req, res) => res.json(await svc.getCds(req.params.slug)))

  router.post(`${base}/allocations/simulate`, limit, async (req, res) =>
    res.json(await svc.simulate(req.params.slug, parseSimulationInput(req))),
  )

  router.get(`${base}/plans`, async (req, res) => res.json(await svc.listPlans(req.params.slug)))
  router.post(`${base}/plans`, limit, async (req, res) => res.status(201).json(await svc.savePlan(req.params.slug, parsePlanInput(req))))
  router.post(`${base}/plans/:planId/decision`, async (req, res) =>
    res.json(await svc.decidePlan(req.params.slug, req.params.planId, parsePlanDecision(req))),
  )
  router.delete(`${base}/plans/:planId`, async (req, res) => res.json(await svc.removePlan(req.params.slug, req.params.planId)))

  router.post(`${base}/cds/:accountId/decision`, async (req, res) =>
    res.json(await svc.decideCd(req.params.slug, req.params.accountId, parseCdDecision(req))),
  )
  router.delete(`${base}/cds/:accountId/decision`, async (req, res) => res.json(await svc.clearCd(req.params.slug, req.params.accountId)))

  return router
}

export default createInvestmentRouter()
