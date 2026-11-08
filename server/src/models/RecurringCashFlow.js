import mongoose from 'mongoose';
import { cents, SOURCES, provenanceIndex } from './cents.js';

const ref = (to) => ({ type: mongoose.Schema.Types.ObjectId, ref: to, default: null });

const recurringCashFlowSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemoProfile', required: true },
    name: { type: String, required: true },
    kind: {
      type: String,
      required: true,
      enum: ['income', 'bill', 'loan_payment', 'credit_card_payment', 'savings_contribution', 'retirement_contribution'],
    },
    signedAmountCents: cents({ required: true }), // net take-home for income; negative for outflows
    grossAmountCents: cents({ default: null }), // income only
    frequency: { type: String, required: true, enum: ['weekly', 'biweekly', 'monthly'] },
    nextDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD, as the engine expects
    endDate: { type: String, default: null, match: /^\d{4}-\d{2}-\d{2}$/ },
    accountId: ref('Account'),
    loanId: ref('Loan'),
    category: { type: String, default: 'other' },
    source: { type: String, required: true, enum: SOURCES },
    externalId: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
recurringCashFlowSchema.index({ profileId: 1 });
recurringCashFlowSchema.index(...provenanceIndex);

export default mongoose.model('RecurringCashFlow', recurringCashFlowSchema);
