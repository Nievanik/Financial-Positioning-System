import mongoose from 'mongoose';

const demoProfileSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    displayName: { type: String, required: true },
    nessieCustomerId: { type: String, default: null },
    currency: { type: String, default: 'USD' },
    timeZone: { type: String, default: 'America/Chicago' },
    forecastSettings: {
      asOfDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
      historyMonths: { type: Number, default: 3 },
      cashFloorCents: { type: Number, default: 0 },
      variableExpenseFrequency: { type: String, enum: ['weekly'], default: 'weekly' },
      categoryOverridesCents: { type: Map, of: Number, default: {} },
    },
    lastSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('DemoProfile', demoProfileSchema);
