import mongoose from 'mongoose';
import { cents, SOURCES, provenanceIndex } from './cents.js';

const transactionSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemoProfile', required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    source: { type: String, required: true, enum: SOURCES },
    externalId: { type: String, default: null },
    occurredAt: { type: Date, required: true },
    description: { type: String, default: '' },
    merchantName: { type: String, default: '' },
    amountCents: cents({ required: true, min: 0 }),
    cashflowKind: {
      type: String,
      required: true,
      enum: ['income', 'cash_expense', 'internal_transfer', 'credit_purchase', 'credit_payment', 'loan_payment', 'savings_contribution', 'retirement_contribution'],
    },
    cashImpactCents: cents({ required: true }), // set by the normalizer, never by hand
    category: {
      type: String,
      required: true,
      enum: ['income', 'groceries', 'housing', 'transport', 'utilities', 'entertainment', 'subscriptions', 'health', 'debt', 'savings', 'other'],
    },
    transferGroupId: { type: String, default: null },
    isRecurringCandidate: { type: Boolean, default: false },
  },
  { timestamps: true },
);
transactionSchema.index({ profileId: 1, occurredAt: -1 });
transactionSchema.index(...provenanceIndex);

export default mongoose.model('Transaction', transactionSchema);
