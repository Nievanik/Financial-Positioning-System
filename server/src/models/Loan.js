import mongoose from 'mongoose';
import { cents, SOURCES, provenanceIndex } from './cents.js';

// Describes the debt only; the payment is subtracted once, via its recurringCashFlow.
const loanSchema = new mongoose.Schema(
  {
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'DemoProfile', required: true },
    name: { type: String, required: true },
    loanType: { type: String, required: true, enum: ['auto', 'mortgage', 'student', 'personal', 'other'] },
    outstandingCents: cents({ required: true }),
    monthlyPaymentCents: cents({ required: true }),
    dueDay: { type: Number, required: true, min: 1, max: 31, validate: { validator: Number.isInteger, message: 'dueDay must be an integer' } },
    annualRateBps: cents({ default: null }),
    source: { type: String, required: true, enum: SOURCES },
    externalId: { type: String, default: null },
  },
  { timestamps: true },
);
loanSchema.index({ profileId: 1 });
loanSchema.index(...provenanceIndex);

export default mongoose.model('Loan', loanSchema);
