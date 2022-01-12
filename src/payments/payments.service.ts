import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import Stripe from 'stripe';
import * as braintree from 'braintree';
import { CardsService } from 'src/cards/cards.service';
import { UsersService } from 'src/users/users.service';
import * as mongoose from 'mongoose';

const stripe = new Stripe(ConfigService.keys.STRIPE_API_KEY, {
  apiVersion: '2020-08-27',
});

const braintreeGateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: ConfigService.keys.BRAINTREE_MERCHANT_ID,
  publicKey: ConfigService.keys.BRAINTREE_PUBLIC_KEY,
  privateKey: ConfigService.keys.BRAINTREE_PRIVATE_KEY,
});

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Transaction') private readonly transactionModel: Model<any>,
    @InjectModel('Refund') private readonly refundModel: Model<any>,
    private readonly cardsService: CardsService,
    private readonly usersService: UsersService,
  ) {}

  async getPayments(args) {
    const payments = await this.transactionModel.aggregate([
      {
        $match: args,
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'parentTransactionId',
          as: 'refunds',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
    ]);

    return { data: { payments }, message: '', success: true };
  }

  async getPaymentsUserProfile(userId) {
    const payments = await this.transactionModel.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: 'refunds',
          localField: '_id',
          foreignField: 'parentTransactionId',
          as: 'refunds',
        },
      },
    ]);

    return payments;
  }

  // Create Gateway Customers ==========================================

  async stripeCreateCustomer(userId, email, name) {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    this.usersService.createLocalCust(customer.id, 'Stripe', userId);
    return customer;
  }

  async braintreeCustomerCreate(userId, email, firstName, lastName) {
    const customer = await braintreeGateway.customer.create({
      email,
      firstName,
      lastName,
    });

    this.usersService.createLocalCust(
      customer.customer.id,
      'Braintree',
      userId,
    );
    return customer;
  }

  // Update Gateway Customers ==========================================

  async braintreeCustomerUpdate(customerId, dto) {
    const customer = await braintreeGateway.customer.update(customerId, dto);
    return customer;
  }

  async stripeCustomerUpdate(customerId, dto) {
    const customer = await stripe.customers.update(customerId, dto);
    return customer;
  }

  // Delete Gateway Customers ==========================================

  async braintreeCustomerDelete(customerId) {
    braintreeGateway.customer.delete(customerId);
    //delete credit card here as well
    const cards = await this.cardsService.getGatewayMultiCards({ customerId });
    cards.forEach((element) => {
      this.braintreeCreditCardDelete(String(element.cardId));
    });
    return true;
  }

  async stripeCustomerDelete(customerId) {
    stripe.customers.del(customerId);
    const cards = await this.cardsService.getGatewayMultiCards({ customerId });
    cards.forEach((element) => {
      this.stripeCreditCardDelete(customerId, String(element.cardId));
    });
  }

  async createPaymentMethod(number, exp_month, exp_year, cvc, name, city) {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number,
        exp_month,
        exp_year,
        cvc,
      },
      billing_details: {
        name,
        address: {
          city,
          country: 'USA',
        },
      },
    });

    return paymentMethod;
  }

  async stripeCreateIntent(amount, currency) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: ['card'],
    });

    return paymentIntent;
  }

  async stripeRefund(paymentIntent, amount) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent,
      amount,
    });

    return refund;
  }

  async braintreeGenerateClientToken(customerId) {
    const { clientToken } = await braintreeGateway.clientToken.generate({
      customerId,
    });

    return { data: { clientToken }, message: '', success: true };
  }

  // Create Transaction ======================================
  async braintreeCreateTransaction(userId, deviceData, amount, description) {
    const cust = await this.usersService.getLocalCust('Braintree', userId);
    const transaction = await braintreeGateway.transaction.sale({
      amount,
      deviceData,
      options: {
        submitForSettlement: true,
      },
      customerId: cust.customerId,
    });

    new this.transactionModel({
      transactionId: transaction.transaction.id,
      gateway: 'Braintree',
      user: userId,
      meta: transaction.transaction,
      description
    }).save();

    return transaction;
  }

  async stripeCreateTransaction(
    userId,
    amount,
    paymentMethod,
    currency,
    description,
  ) {
    const customer = await this.usersService.getLocalCust('Stripe', userId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customer.customerId,
      payment_method: paymentMethod,
      description,
      setup_future_usage: 'off_session',
    });

    stripe.paymentIntents.confirm(paymentIntent.id);

    new this.transactionModel({
      transactionId: paymentIntent.id,
      gateway: 'Stripe',
      user: userId,
      meta: paymentIntent,
    }).save();

    return paymentIntent;
  }

  // Refund ======================================

  async braintreeGenerateRefund(admin, transactionId, amount: string, reason) {
    const transaction = await this.transactionModel
      .findOne({ _id: transactionId })
      .exec();
    const refund = await braintreeGateway.transaction.refund(
      transaction.transactionId,
      amount,
    );

    if (
      !refund.success &&
      refund.message == 'Cannot refund transaction unless it is settled.'
    ) {
      throw new HttpException(refund.message, HttpStatus.BAD_REQUEST);
    }

    new this.refundModel({
      parentTransactionId: transactionId,
      refundId: refund.transaction.id,
      createdBy: admin._id,
      meta: refund.transaction,
      reason,
    }).save();
    return refund;
  }

  async stripeGenerateRefund(admin, transactionId, amount, reason) {
    const transaction = await this.transactionModel
      .findOne({ _id: transactionId })
      .exec();
    const refund = await stripe.refunds.create({
      payment_intent: transaction.transactionId,
      amount,
      reason,
    });

    new this.refundModel({
      parentTransactionId: transactionId,
      refundId: refund.id,
      createdBy: admin._id,
      meta: refund,
      reason,
    }).save();
    return refund;
  }

  // If time spared, can put cutomer custom search based on various fields as well

  // Save Credit Card==============================================
  async braintreeCreditCardSave(
    customerId,
    number,
    expirationDate,
    cvv,
    cardholderName,
  ) {
    const creditCard = await braintreeGateway.creditCard.create(
      {
        customerId,
        number,
        expirationDate,
        cvv,
        cardholderName,
        options: {
          verifyCard: true,
        },
      },
      { failOnDuplicatePaymentMethod: true, verifyCard: true },
    );

    return creditCard;
  }

  async stripeCreditCardSave(
    customerId,
    number,
    expirationDate,
    cvv,
    cardholderName,
  ) {
    const token = await stripe.tokens.create({
      card: {
        number,
        exp_month: expirationDate.split('/')[0],
        exp_year: expirationDate.split('/')[1],
        cvc: cvv,
        name: cardholderName,
      },
    });

    const pm = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: token.id,
      },
      billing_details: {
        address: {
          city: '',
        },
        name: cardholderName,
      },
    });

    await stripe.paymentMethods.attach(pm.id, { customer: customerId });

    return pm;
  }

  // Credit Card Delete ==================================
  async braintreeCreditCardDelete(credCardToken) {
    braintreeGateway.creditCard.delete(credCardToken);
    return true;
  }

  async stripeCreditCardDelete(customerId, cardId) {
    stripe.paymentMethods.detach(cardId);
    return true;
  }

  // Credit Card Update ===================================
  async braintreeCreditCardUpdate(credCardToken, dto) {
    const creditCard = await braintreeGateway.creditCard.update(
      credCardToken,
      dto,
    );
    return creditCard;
  }

  async stripeCreditCardUpdate(customerId, credCardId, dto) {
    dto.exp_month = dto.expirationDate
      ? dto.expirationDate.split('/')[0]
      : undefined;
    dto.exp_year = dto.expirationDate
      ? dto.expirationDate.split('/')[1]
      : undefined;
    delete dto['expirationDate'];

    const creditCard = await stripe.paymentMethods.update(credCardId, {
      card: { exp_month: dto.exp_month, exp_year: dto.exp_year },
      billing_details: { name: dto.cardholderName },
    });
    return creditCard;
  }

  async braintreeCreditCardFind(credCardToken) {
    const card = await braintreeGateway.creditCard.find(credCardToken);
    return card;
  }

  async braintreeCustomerFind(customerId) {
    const customer = await braintreeGateway.customer.find(customerId);
    return customer;
  }

  async deletePayments(userId) {
    const transactions = await this.transactionModel.find({ user: userId });
    this.transactionModel.deleteMany({ user: userId }).exec();
    const transIds = [];

    transactions.forEach((element) => {
      transIds.push(element._id);
    });

    this.refundModel
      .deleteMany({ parentTransactionId: { $in: transIds } })
      .exec();

    return;
  }
}
