import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentsService } from 'src/payments/payments.service';
import { UsersService } from 'src/users/users.service';
import * as mongoose from 'mongoose';
import { CardsService } from 'src/cards/cards.service';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel('Gateway') private readonly gatewayModel: Model<any>,
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
    private readonly cardsService: CardsService,
  ) {}

  async getAllUsers() {
    return await this.usersService.getUsers({ roles: { $ne: 'Admin' } });
  }

  async getAllPayments() {
    return await this.paymentsService.getPayments({});
  }

  async getUserProfile(userId) {
    const user = await this.usersService.getUserProfile({
      _id: new mongoose.Types.ObjectId(userId),
    });
    const transactions = await this.paymentsService.getPaymentsUserProfile(
      userId,
    );

    return {
      data: { user: user.user, cards: user.cards, transactions },
      success: true,
      message: '',
    };
  }

  async createUser(admin, dto) {
    const user = await this.usersService.createUser(admin, dto);

    /////////////////////Braintree////////////////////
    this.paymentsService.braintreeCustomerCreate(
      user._id,
      dto.email,
      dto.firstName,
      dto.lastName,
    );

    /////////////////////Stripe//////////////////////
    this.paymentsService.stripeCreateCustomer(
      user._id,
      dto.email,
      dto.firstName + ' ' + dto.lastName,
    );
    return {
      data: { user },
      message: 'User created successfully',
      success: true,
    };
  }

  async updateUser(userId, dto) {
    const user = await this.usersService.updateUser(userId, dto);

    ////////////////////Braintree/////////////////////
    const custBraintree = await this.usersService.getLocalCust(
      'Braintree',
      user._id,
    );
    this.paymentsService.braintreeCustomerUpdate(custBraintree.customerId, dto);
    /////////////////////Stripe////////////////////
    const custStripe = await this.usersService.getLocalCust('Stripe', user._id);
    dto.name = dto.firstName + ' ' + dto.lastName;
    dto.firstName = undefined;
    dto.lastName = undefined;
    this.paymentsService.stripeCustomerUpdate(custStripe.customerId, dto);

    return {
      data: { user },
      message: 'User updated successfully.',
      success: true,
    };
  }

  async deleteUser(userId) {
    ////////////////Braintree////////////////////
    const custBraintree = await this.usersService.getLocalCust(
      'Braintree',
      userId,
    );
    this.paymentsService.braintreeCustomerDelete(custBraintree.customerId);

    //////////////////Stripe/////////////////
    const custStripe = await this.usersService.getLocalCust('Stripe', userId);
    this.paymentsService.stripeCustomerDelete(custStripe.customerId);
    const card = await this.cardsService.getCard({ user: userId });
    this.usersService.deleteUser(userId);
    card && this.cardsService.deleteCard(card._id);
    this.paymentsService.deletePayments(userId);

    return {
      data: {},
      message: 'User deleted successfully!',
      success: true,
    };
  }

  async saveCreditCard(userId, number, expirationDate, cvv, cardholderName) {
    const user = await this.usersService.getUserProfile({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      throw new HttpException('No such user exists!', HttpStatus.BAD_REQUEST);
    }

    const customerBraintree = await this.usersService.getLocalCust(
      'Braintree',
      userId,
    );
    const customerStripe = await this.usersService.getLocalCust(
      'Stripe',
      userId,
    );
    const braintreeCard = await this.paymentsService.braintreeCreditCardSave(
      customerBraintree.customerId,
      number,
      expirationDate,
      cvv,
      cardholderName,
    );
    const cardType = braintreeCard.creditCard.cardType;

    const stripeCard = await this.paymentsService.stripeCreditCardSave(
      customerStripe.customerId,
      number,
      expirationDate,
      cvv,
      cardholderName,
    );

    const localCreditCard = await this.cardsService.createCard(userId, {
      number,
      expirationDate,
      cvv,
      cardType,
      cardholderName,
    });

    this.cardsService.saveGatewayCreditCardId(
      braintreeCard.creditCard.token,
      'Braintree',
      customerBraintree.customerId,
      localCreditCard.data.card._id,
    );

    this.cardsService.saveGatewayCreditCardId(
      stripeCard.id,
      'Stripe',
      customerStripe.customerId,
      localCreditCard.data.card._id,
    );

    return { data: {}, message: 'Card saved successfully.', success: true };
  }

  async updateCreditCard(localCardId, dto) {
    const gatewayCard = await this.cardsService.getGatewayMultiCards({
      localCardId,
    });
    gatewayCard.forEach((element) => {
      if (element.gateway === 'Braintree') {
        this.paymentsService.braintreeCreditCardUpdate(element.cardId, dto);
      }
      if (element.gateway === 'Stripe') {
        this.paymentsService.stripeCreditCardUpdate(
          element.customerId,
          element.cardId,
          { ...dto },
        );
      }
    });

    return await this.cardsService.updateCard(localCardId, dto);
  }

  async deleteCreditCard(localCardId) {
    const gatewayCard = await this.cardsService.getGatewayMultiCards({
      localCardId,
    });

    gatewayCard.forEach((element) => {
      if (element.gateway === 'Braintree') {
        this.paymentsService.braintreeCreditCardDelete(element.cardId);
      }
      if (element.gateway === 'Stripe') {
        this.paymentsService.stripeCreditCardDelete(
          element.customerId,
          element.cardId,
        );
      }
    });

    return await this.cardsService.deleteCard(localCardId);
  }

  async getGateways() {
    const gateways = await this.gatewayModel.find().exec();
    return { data: { gateways }, message: '', success: true };
  }

  async braintreeGenerateClientToken(userId) {
    const customer = await this.usersService.getLocalCust('Braintree', userId);

    if (!customer) {
      throw new HttpException('No such user exists!', HttpStatus.BAD_REQUEST);
    }

    return await this.paymentsService.braintreeGenerateClientToken(
      customer.customerId,
    );
  }

  async chargeUser(gateway, userId, amount, extra) {
    let transaction;
    let status;
    let success = true;

    if (gateway === 'Braintree') {
      transaction = await this.paymentsService.braintreeCreateTransaction(
        userId,
        {},
        amount,
      );
      status = transaction.transaction.status;
      success = transaction.success;
    } else if (gateway === 'Stripe') {
      const locCust = await this.usersService.getLocalCust('Stripe', userId);
      const pm = await this.cardsService.getGatewayCard({
        customerId: locCust.customerId,
      });
      transaction = await this.paymentsService.stripeCreateTransaction(
        userId,
        amount,
        pm.cardId,
        'inr',
        extra.description,
      );
    }

    return { data: { transaction, status }, message: '', success };
  }

  async refundUser(user, gateway, amount, transactionId, reason) {
    let refund;
    let status;
    let success = true;
    if (gateway === 'Braintree') {
      refund = await this.paymentsService.braintreeGenerateRefund(
        user,
        transactionId,
        String(amount),
        reason,
      );

      status = refund.transaction.status;
      success = refund.success;
    } else if (gateway === 'Stripe') {
      refund = await this.paymentsService.stripeGenerateRefund(
        user,
        transactionId,
        amount,
        reason,
      );

      status = refund.status;
    }

    return { data: { refund, status }, message: '', success };
  }
}
