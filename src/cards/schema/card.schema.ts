import * as mongoose from 'mongoose';

export const Credit_CardSchema = new mongoose.Schema({
  cardType: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  expirationDate: { type: String, required: true },
  number: { type: String, required: true },
  cardholderName: { type: String, required: true },
});
