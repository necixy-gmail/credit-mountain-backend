import {
  Body,
  Controller,
  Post,
  Request,
  Headers,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { username, password, role } = dto;
    return await this.authService.login(username, password, role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req, @Headers() headers) {
    const { user } = req;
    const { authorization } = headers;
    const token = authorization.substring(7, authorization.length);
    return await this.authService.logout(user, token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('changePassword')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const { user } = req;
    const { newPassword, currentPassword } = dto;
    return await this.authService.changePassword(
      user,
      newPassword,
      currentPassword,
    );
  }
}
