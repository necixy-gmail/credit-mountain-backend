import * as mongoose from 'mongoose';

export const RefundSchema = new mongoose.Schema(
  {
    refundId: { type: String, unique: true },
    parentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    meta: Object,
  },
  {
    timestamps: true,
  },
);
