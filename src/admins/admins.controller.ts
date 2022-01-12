import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ROLES } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { ChargeUserDto } from 'src/payments/dto/chargeUser.dto';
import { RefundUserDto } from 'src/payments/dto/refundUser.dto';
import { CreateUserDto } from 'src/users/dto/createUser.dto';
import { SaveCardDto } from 'src/cards/dto/saveCard.dto';
import { UpdateCardDto } from 'src/cards/dto/updateCard.dto';
import { UpdateUserDto } from 'src/users/dto/updateUser.dto';
import { AdminsService } from './admins.service';

@Controller('admin')
@ROLES(Role.Admin)
@UseGuards(JwtAuthGuard)
export class AdminsController {
  constructor(private readonly adminService: AdminsService) {}

  @Get('allUsers')
  async getAllUsers() {
    return await this.adminService.getAllUsers();
  }

  @Get('allPayments')
  async getAllPayments() {
    return await this.adminService.getAllPayments();
  }

  @Get('userProfile/:userId')
  async getUserProfile(@Param('userId') userId: string) {
    return await this.adminService.getUserProfile(userId);
  }

  @Post('createUser')
  async createUser(@Request() req, @Body() dto: CreateUserDto) {
    const { user } = req;
    return await this.adminService.createUser(user, dto);
  }

  @Patch('updateUser/:userId')
  async updateUser(
    @Body() dto: UpdateUserDto,
    @Param('userId') userId: string,
  ) {
    return await this.adminService.updateUser(userId, dto);
  }

  @Delete('deleteUser/:userId')
  async deleteUser(@Param('userId') userId: string) {
    return await this.adminService.deleteUser(userId);
  }

  @Post('saveCard/:userId')
  async saveNewCreditCard(
    @Param('userId') userId: string,
    @Body() dto: SaveCardDto,
  ) {
    return await this.adminService.saveCreditCard(
      userId,
      String(dto.number),
      dto.expirationDate,
      dto.cvv,
      dto.cardholderName,
    );
  }

  @Patch('updateCard/:cardId')
  async updateCard(
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
  ) {
    return await this.adminService.updateCreditCard(cardId, dto);
  }

  @Delete('deleteCard/:cardId')
  async deleteCard(@Param('cardId') cardId: string) {
    return await this.adminService.deleteCreditCard(cardId);
  }

  @Get('clientToken/:userId')
  async braintreeClientToken(@Param('userId') userId: string) {
    return await this.adminService.braintreeGenerateClientToken(userId);
  }

  @Post('charge/:userId')
  async chargeUser(
    @Param('userId') userId: string,
    @Body() dto: ChargeUserDto,
  ) {
    const { gateway, amount, extra } = dto;
    return await this.adminService.chargeUser(gateway, userId, amount, extra);
  }

  @Post('refund/:transactionId')
  async refundUser(
    @Request() req,
    @Param('transactionId') transactionId: string,
    @Body() dto: RefundUserDto,
  ) {
    const { user } = req;
    const { gateway, amount, reason } = dto;
    return await this.adminService.refundUser(
      user,
      gateway,
      amount,
      transactionId,
      reason,
    );
  }
}
