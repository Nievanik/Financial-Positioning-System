import { rateLimit } from 'express-rate-limit';

// Per-IP, in-memory (resets on restart; fine for one Render instance). Needs `trust proxy` behind Render.
export const limiter = (max, windowMs = 60_000) => rateLimit({
  windowMs, limit: max, standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down', details: {} } }),
});

export const calcLimit = limiter(60); // forecast, health-metrics, scenarios, recommendations
export const explainLimit = limiter(10); // the only route that can spend AI quota
export const writeLimit = limiter(30); // profile editing routes (engineering.md 5.4)
