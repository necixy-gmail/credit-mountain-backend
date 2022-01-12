import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UtilsModule } from 'src/utils/utils.module';
import { CardsService } from './cards.service';
import { Credit_CardSchema } from './schema/card.schema';
import { Gateway_CardSchema } from './schema/gateway_card.schema';

@Module({
  imports: [
    UtilsModule,
    MongooseModule.forFeature([
      { name: 'Card', schema: Credit_CardSchema },
      { name: 'Gateway_Card', schema: Gateway_CardSchema },
    ]),
  ],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
