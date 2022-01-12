import * as mongoose from 'mongoose';

export const Gateway_CustomerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true },
  gateway: { type: String, enum: ['Braintree', 'Stripe'] },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
