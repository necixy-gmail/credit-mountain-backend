import * as mongoose from 'mongoose';

export const Gateway_CardSchema = new mongoose.Schema({
  cardId: { type: String, required: true, unique: true },
  gateway: { type: String, enum: ['Braintree', 'Stripe'] },
  customerId: {
    type: String,
    required: true,
  },
  localCardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
});
