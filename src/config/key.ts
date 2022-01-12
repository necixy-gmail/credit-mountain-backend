export class Keys {
  PORT: string = null;
  MONGO_URI: string = null;
  JWT_SECRET: string = null;
  ENCRYPTION_SECRET: string = null;
  STRIPE_API_KEY: string = null;
  BRAINTREE_MERCHANT_ID: string = null;
  BRAINTREE_PUBLIC_KEY: string = null;
  BRAINTREE_PRIVATE_KEY: string = null;
  constructor() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config();
    } catch (error) {}

    this.prepareKeys();
  }

  prepareKeys() {
    this.PORT = process.env.PORT;
    this.MONGO_URI = process.env.MONGO_URI;
    this.JWT_SECRET = process.env.JWT_SECRET;
    this.ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET;
    this.STRIPE_API_KEY = process.env.STRIPE_API_KEY;
    this.BRAINTREE_MERCHANT_ID = process.env.BRAINTREE_MERCHANT_ID;
    this.BRAINTREE_PUBLIC_KEY = process.env.BRAINTREE_PUBLIC_KEY;
    this.BRAINTREE_PRIVATE_KEY = process.env.BRAINTREE_PRIVATE_KEY;
  }
}
