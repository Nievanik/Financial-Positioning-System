// Error shape from docs/engineering.md section 5.3.
export function notFound(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', details: {} } });
}

export const httpError = (status, code, message, details = {}) => Object.assign(new Error(message), { status, code, details });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // express.json parse failures arrive with status 400; DB outages (Mongoose/Mongo driver errors) become 503.
  if (/Mongo/.test(err.name) && !err.status) err = httpError(503, 'DB_UNAVAILABLE', 'Database unavailable');
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
      message: status === 503 ? err.message : status >= 500 ? 'Unexpected error' : err.message,
      details: err.details || {},
    },
  });
}
