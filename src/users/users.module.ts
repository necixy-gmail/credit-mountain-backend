import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserSchema } from './schema/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from 'src/config/config.service';
import { ConfigModule } from 'src/config/config.module';
import { UtilsModule } from 'src/utils/utils.module';
import { Gateway_CustomerSchema } from './schema/gateway_customer.schema';
import { CardsModule } from 'src/cards/cards.module';

@Module({
  imports: [
    ConfigModule,
    UtilsModule,
    CardsModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Gateway_Customer', schema: Gateway_CustomerSchema },
    ]),
    JwtModule.register({
      secret: ConfigService.keys.JWT_SECRET,
      signOptions: { expiresIn: '60000s' },
      verifyOptions: { ignoreExpiration: false },
    }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
