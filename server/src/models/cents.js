// Money is stored as integer cents (docs/engineering.md section 3.4).
export const cents = (extra = {}) => ({
  type: Number,
  validate: { validator: (v) => v === null || Number.isInteger(v), message: '{PATH} must be integer cents' },
  ...extra,
});

export const SOURCES = ['nessie', 'supplemental_synthetic'];
// Idempotent-upsert key; only enforced for records that have an external id.
export const provenanceIndex = [{ profileId: 1, source: 1, externalId: 1 }, { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } }];
