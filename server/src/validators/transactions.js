/**
 * Query validation for GET /profiles/:slug/transactions (engineering.md 5.1). Pure: no Express, no DB.
 * Returns the MongoDB filter and limit, or throws 400 VALIDATION_FAILED / 404 ACCOUNT_NOT_FOUND.
 */
import { httpError } from '../middleware/errorHandler.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const OBJECT_ID = /^[0-9a-f]{24}$/i;
const bad = (message, details) => httpError(400, 'VALIDATION_FAILED', message, details);

/**
 * @param {object} query        req.query
 * @param {object} ctx
 * @param {*} ctx.profileId     the resolved profile's _id
 * @param {string[]} ctx.accountIds  this profile's account ids (stringified)
 * @param {string[]} ctx.categories  allowed category enum values
 */
export function parseTransactionQuery(query, { profileId, accountIds, categories }) {
  const { from, to, category, accountId } = query;
  const limit = query.limit === undefined ? 50 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw bad('limit must be an integer 1-100');
  for (const [k, v] of Object.entries({ from, to })) if (v !== undefined && (typeof v !== 'string' || !DAY.test(v))) throw bad(`${k} must be YYYY-MM-DD`);
  if (category !== undefined && !categories.includes(category)) throw bad('Unknown category', { allowed: categories });
  if (accountId !== undefined) {
    if (typeof accountId !== 'string' || !OBJECT_ID.test(accountId)) throw bad('accountId must be a 24-character account id', { field: 'accountId' });
    if (!accountIds.includes(accountId.toLowerCase())) throw httpError(404, 'ACCOUNT_NOT_FOUND', 'That account does not belong to this demo profile');
  }

  const filter = { profileId };
  if (from || to) filter.occurredAt = { ...(from && { $gte: new Date(`${from}T00:00:00Z`) }), ...(to && { $lte: new Date(`${to}T23:59:59Z`) }) };
  if (category) filter.category = category;
  if (accountId) filter.accountId = accountId.toLowerCase();
  return { filter, limit };
}
