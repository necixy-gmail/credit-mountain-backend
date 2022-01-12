import * as mongoose from 'mongoose';

export const GatewaySchema = new mongoose.Schema({
  gateway: { type: String, unique: true, required: true },
});
