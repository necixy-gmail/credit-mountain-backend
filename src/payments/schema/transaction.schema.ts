import * as mongoose from 'mongoose';

export const TransactionSchema = new mongoose.Schema(
  {
    gateway: { type: String, enum: ['Braintree', 'Stripe'] },
    transactionId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: Object,
    description: String
  },
  {
    timestamps: true,
  },
);
