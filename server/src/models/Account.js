import mongoose from 'mongoose';
import { cents, SOURCES, provenanceIndex } from './cents.js';

const accountSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemoProfile', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ['checking', 'savings', 'credit_card', 'retirement', 'cd', 'investment'] },
    balanceCents: cents({ required: true }), // credit cards: amount owed
    creditLimitCents: cents({ default: null }),
    source: { type: String, required: true, enum: SOURCES },
    externalId: { type: String, default: null },
    asOf: { type: Date, required: true },
    // Optional supplemental investment metadata (engineering.md section 10); null for cash/credit accounts.
    riskLevel: { type: String, enum: ['low', 'moderate', 'high', null], default: null },
    annualRateBps: { type: Number, default: null, validate: { validator: (v) => v === null || Number.isInteger(v), message: '{PATH} must be integer bps' } },
    maturityDate: { type: String, default: null, match: /^\d{4}-\d{2}-\d{2}$/ },
    holdingsNote: { type: String, default: null },
  },
  { timestamps: true },
);
accountSchema.index({ profileId: 1, type: 1 });
accountSchema.index(...provenanceIndex);

export default mongoose.model('Account', accountSchema);
