import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UtilsService } from 'src/utils/utils.service';
import { CardsService } from 'src/cards/cards.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Gateway_Customer')
    private readonly gatewayCustModel: Model<any>,
    private readonly utilsService: UtilsService,
    private readonly cardsService: CardsService,
  ) {}

  async getUserApp(args, projections) {
    const user = await this.userModel
      .findOne(args, projections)
      .select('+password')
      .select('+sessions')
      .exec();

    return user;
  }

  async createUser(admin, dto) {
    dto.password = await bcrypt.hash(dto.password || 'qwerty', 12);
    let user = new this.userModel(dto);

    user.createdBy = admin._id;
    user = await user.save();

    user.password = undefined;
    user.sessions = undefined;

    return user;
  }

  async updateUser(userId, dto) {
    if (
      dto.email &&
      (await this.userModel.findOne({ email: dto.email }).exec())
    ) {
      throw new HttpException(
        'Given new email already exists!',
        HttpStatus.BAD_REQUEST,
      );
    }
    let user = await this.userModel.findOne({ _id: userId }).exec();
    if (!user) {
      throw new HttpException(
        "User doesn't exist associated with given Id",
        HttpStatus.BAD_REQUEST,
      );
    }
    Object.keys(dto).forEach((element) => {
      user[element] = dto[element];
    });

    user = await user.save();
    return user;
  }

  async getUsers(args) {
    const users = await this.userModel.find(args).exec();
    return { data: { users }, message: '', success: true };
  }

  async getUserProfile(args) {
    const user = await this.userModel.findOne(args).exec();
    const cards = await this.cardsService.getMultiCards({ user: user._id });
    for (let i = 0; i < cards.length; i++) {
      cards[i].number = this.utilsService.decryptData(cards[i].number);
      cards[i].cardholderName = this.utilsService.decryptData(
        cards[i].cardholderName,
      );
      cards[i].expirationDate = this.utilsService.decryptData(
        cards[i].expirationDate,
      );
      cards[i].cardType = this.utilsService.decryptData(cards[i].cardType);
    }
    return { user, cards };
  }

  async deleteUser(userId) {
    this.gatewayCustModel.deleteMany({ user: userId }).exec();
    return await this.userModel.deleteOne({ _id: userId }).exec();
  }

  async createLocalCust(custId, gateway, userId) {
    new this.gatewayCustModel({
      customerId: custId,
      gateway,
      user: userId,
    }).save();
  }

  async getLocalCust(gateway, userId) {
    return await this.gatewayCustModel
      .findOne({ gateway, user: userId })
      .exec();
  }
}
