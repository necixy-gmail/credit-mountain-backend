import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export enum Gateway {
  Braintree = 'Braintree',
  Stripe = 'Stripe',
}

export class ChargeUserDto {
  @IsNotEmpty()
  @IsEnum(Gateway)
  gateway: Gateway;

  @IsNotEmpty()
  @IsNumber()
  amount: string;

  @IsNotEmpty()
  extra: any;
}
