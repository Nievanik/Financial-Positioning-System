/** GET hooks for the Investment Planner endpoints (engineering.md section 10). Keys include the slug. */
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'

export const useInvestmentAssumptions = () => useApi('inv-assumptions', (o) => api.getInvestmentAssumptions(o))
export const useInvestmentPortfolio = (slug) => useApi(`inv-portfolio:${slug}`, (o) => api.getInvestmentPortfolio(slug, o))
export const useInvestmentCds = (slug) => useApi(`inv-cds:${slug}`, (o) => api.getInvestmentCds(slug, o))
export const useInvestmentPlans = (slug) => useApi(`inv-plans:${slug}`, (o) => api.listInvestmentPlans(slug, o))
