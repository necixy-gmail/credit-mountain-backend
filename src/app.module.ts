import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminsModule } from './admins/admins.module';
import { UtilsModule } from './utils/utils.module';
import { CardsModule } from './cards/cards.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    MongooseModule.forRoot(ConfigService.keys.MONGO_URI),
    UsersModule,
    PaymentsModule,
    AdminsModule,
    UtilsModule,
    CardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
