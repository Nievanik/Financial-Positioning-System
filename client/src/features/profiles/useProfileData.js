/** GET hooks for the profile-scoped endpoints in engineering.md §5.1. Every cache key includes the slug. */
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'

export const useProfiles = () => useApi('profiles', (o) => api.getProfiles(o))
export const useOverview = (slug) => useApi(slug ? `overview:${slug}` : null, (o) => api.getOverview(slug, o))
export const useForecast = (slug) => useApi(slug ? `forecast:${slug}` : null, (o) => api.getForecast(slug, o))
export const useHealthMetrics = (slug) => useApi(slug ? `health:${slug}` : null, (o) => api.getHealthMetrics(slug, o))
export const useSpending = (slug, months = 3) =>
  useApi(slug ? `spending:${slug}:${months}` : null, (o) => api.getSpending(slug, months, o))
export const useRecommendations = (slug) =>
  useApi(slug ? `recommendations:${slug}` : null, (o) => api.getRecommendations(slug, o))
export const useTransactions = (slug, params) => {
  const key = slug ? `transactions:${slug}:${JSON.stringify(params)}` : null
  return useApi(key, (o) => api.getTransactions(slug, params, o))
}
