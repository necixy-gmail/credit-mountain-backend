import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  expirationDate: string;
  // @IsOptional()
  // @IsString()
  // cvv: string;
  @IsOptional()
  @IsString()
  cardholderName: string;
}
