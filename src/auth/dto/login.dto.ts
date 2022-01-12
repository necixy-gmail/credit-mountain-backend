import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum Role {
  Admin = 'Admin',
  User = 'User',
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;
  @IsNotEmpty()
  @IsString()
  password: string;
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
