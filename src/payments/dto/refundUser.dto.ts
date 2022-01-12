import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gateway } from './chargeUser.dto';

export class RefundUserDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsEnum(Gateway)
  gateway: Gateway;

  @IsOptional()
  @IsString()
  reason: string;
}
