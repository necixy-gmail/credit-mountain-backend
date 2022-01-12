import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class CardsService {
  constructor(
    @InjectModel('Card') private readonly cardModel: Model<any>,
    @InjectModel('Gateway_Card') private readonly gatewayCardModel: Model<any>,
    private readonly utilsService: UtilsService,
  ) {}

  async createCard(userId, dto) {
    if (await this.cardModel.findOne({ user: userId }).exec()) {
      throw new HttpException(
        'Please, delete earlier added card to create new one.',
        HttpStatus.BAD_REQUEST,
      );
    }
    let card = new this.cardModel({});
    dto.number = dto.number.slice(-4);

    Object.keys(dto).forEach((element) => {
      card[element] = this.utilsService.encryptData(dto[element]);
    });
    card.user = userId;

    card = await card.save();
    return {
      data: { card },
      message: 'Card saved successfully.',
      success: true,
    };
  }

  async getCard(args) {
    const card = await this.cardModel.findOne(args).exec();
    return card;
  }

  async getMultiCards(args) {
    const cards = await this.cardModel.find(args).exec();
    return cards;
  }

  async updateCard(cardId, dto) {
    const localCard = await this.getCard({ _id: cardId });
    if (!localCard) {
      throw new HttpException("Card doesn't exist!", HttpStatus.BAD_REQUEST);
    }

    Object.keys(dto).forEach((element) => {
      if (element == 'number') {
        localCard[element] = this.utilsService.encryptData(
          String(dto[element]).slice(-4),
        );
      } else if (element) {
        localCard[element] = this.utilsService.encryptData(dto[element]);
      }
    });

    await localCard.save();

    return { data: {}, message: 'Card updated successfully.', success: true };
  }

  async deleteCard(cardId) {
    this.cardModel.deleteOne({ _id: cardId }).exec();
    this.deleteGatewayCards({ localCardId: cardId });
    return { data: {}, message: 'Card deleted successfully.', success: true };
  }

  async saveGatewayCreditCardId(
    creditCardId,
    gateway,
    customerId,
    localCardId,
  ) {
    new this.gatewayCardModel({
      cardId: creditCardId,
      gateway,
      customerId,
      localCardId,
    }).save();
    return;
  }

  async getGatewayCard(args) {
    return await this.gatewayCardModel.findOne(args).exec();
  }

  async getGatewayMultiCards(args) {
    return await this.gatewayCardModel.find(args).exec();
  }

  async deleteGatewayCards(args) {
    return await this.gatewayCardModel.deleteMany(args).exec();
  }
}
