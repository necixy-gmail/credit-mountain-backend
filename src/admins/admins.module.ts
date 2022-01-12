import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { UsersModule } from 'src/users/users.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { GatewaySchema } from './schema/gateway.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CardsModule } from 'src/cards/cards.module';

@Module({
  imports: [
    UsersModule,
    PaymentsModule,
    CardsModule,
    MongooseModule.forFeature([{ name: 'Gateway', schema: GatewaySchema }]),
  ],
  providers: [AdminsService],
  controllers: [AdminsController],
})
export class AdminsModule {}
