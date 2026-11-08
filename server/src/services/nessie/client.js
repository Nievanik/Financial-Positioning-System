// Server-side Nessie client. See docs/engineering.md section 6 ("Nessie client gotchas") before changing.
// The API key travels as a ?key= query param, so: never log/attach the URL, only the path.
const DEFAULT_BASE = 'https://api.nessieisreal.com';
const TIMEOUT_MS = 10000;

const READ_RESOURCES = ['purchases', 'deposits', 'withdrawals', 'transfers', 'bills', 'loans'];
// A POST without `status` returns 201 but breaks every later GET for that account, and there is no DELETE.
const STATUS_REQUIRED = new Set(READ_RESOURCES);
// Transfers accept ONLY these keys (live-tested); medium/payee_id/payee are rejected or ignored.
const TRANSFER_KEYS = new Set(['status', 'amount', 'transaction_date', 'description']);

export class NessieError extends Error {
  constructor(message, { status = 0, path = '' } = {}) {
    super(message);
    this.name = 'NessieError';
    this.status = status;
    this.path = path;
  }
}

// Nessie returns `_id` on most records but `id` on transfer lists.
export const idOf = (rec) => rec._id ?? rec.id;
// Balances/amounts are whole dollars; engine and DB use integer cents.
export const dollarsToCents = (n) => Math.round(Number(n) * 100);

// Required keys per resource, verified by live POST + GET on 2026-11-08 (docs/engineering.md section 6).
// purchases: from the earlier write test (merchant_id + purchase_date); re-verify if a POST starts failing.
const REQUIRED = {
  deposits: ['medium', 'transaction_date', 'status', 'amount'],
  withdrawals: ['medium', 'transaction_date', 'status', 'amount'],
  bills: ['status', 'payee', 'payment_date', 'recurring_date', 'payment_amount'],
  loans: ['type', 'status', 'monthly_payment', 'amount'],
  purchases: ['merchant_id', 'medium', 'purchase_date', 'status', 'amount'],
  transfers: ['status', 'amount', 'transaction_date'],
};

export function validateRecord(resource, body) {
  if (!READ_RESOURCES.includes(resource)) throw new NessieError(`Unknown Nessie resource: ${resource}`);
  if (STATUS_REQUIRED.has(resource) && !body?.status) throw new NessieError(`${resource} POST requires status`);
  const missing = (REQUIRED[resource] || []).filter((k) => body[k] === undefined);
  if (missing.length) throw new NessieError(`${resource} POST missing: ${missing.join(', ')}`);
  if (resource === 'transfers') {
    const extra = Object.keys(body).filter((k) => !TRANSFER_KEYS.has(k));
    if (extra.length) throw new NessieError(`transfers POST rejects keys: ${extra.join(', ')}`);
  }
}

export function createNessieClient({ apiKey = process.env.NESSIE_API_KEY, baseUrl = process.env.NESSIE_BASE_URL || DEFAULT_BASE, fetchImpl = fetch, timeoutMs = TIMEOUT_MS } = {}) {
  if (!apiKey) throw new NessieError('NESSIE_API_KEY is not set');

  async function request(path, { method = 'GET', body } = {}) {
    const url = new URL(path, baseUrl.replace(/\/?$/, '/'));
    url.searchParams.set('key', apiKey);
    let res;
    try {
      res = await fetchImpl(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Do not chain `err`: its message/cause can contain the full URL including the key.
      throw new NessieError(`Nessie request failed (${err.name})`, { path });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new NessieError(data?.message || res.statusText || 'Nessie error', { status: res.status, path });
    return data;
  }

  return {
    request,
    listAccounts: (customerId) => request(`customers/${customerId}/accounts`),
    list: (accountId, resource) => {
      if (!READ_RESOURCES.includes(resource)) throw new NessieError(`Unknown Nessie resource: ${resource}`);
      return request(`accounts/${accountId}/${resource}`);
    },
    getMerchant: (merchantId) => request(`merchants/${merchantId}`),
    createCustomer: (body) => request('customers', { method: 'POST', body }),
    createAccount: (customerId, body) => request(`customers/${customerId}/accounts`, { method: 'POST', body }),
    createRecord(accountId, resource, body) {
      validateRecord(resource, body);
      return request(`accounts/${accountId}/${resource}`, { method: 'POST', body });
    },
  };
}
