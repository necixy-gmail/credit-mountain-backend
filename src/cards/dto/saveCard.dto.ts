import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveCardDto {
  @IsNotEmpty()
  @IsNumber()
  number: number;
  @IsNotEmpty()
  @IsString()
  expirationDate: string;
  @IsNotEmpty()
  @IsString()
  cvv: string;
  @IsNotEmpty()
  @IsString()
  cardholderName: string;
}
