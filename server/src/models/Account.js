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
  },
  { timestamps: true },
);
accountSchema.index({ profileId: 1, type: 1 });
accountSchema.index(...provenanceIndex);

export default mongoose.model('Account', accountSchema);
