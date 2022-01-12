import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(username, password, role) {
    const user = await this.usersService.getUserApp(
      { email: username, roles: role },
      {},
    );

    if (!user) {
      throw new HttpException(
        'Not a registered user! Please, register first.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new HttpException('Wrong credentials!', HttpStatus.UNAUTHORIZED);
    }

    const payload = {
      sub: user._id,
      sessionId: uuidv4(),
    };

    const accessToken = this.jwtService.sign(payload);
    user.sessions = user.sessions
      ? [...user.sessions, payload.sessionId]
      : [payload.sessionId];

    await user.save();
    user.sessions = undefined;
    user.password = undefined;

    return {
      data: { accessToken, user },
      message: 'Logged in successfully.',
      success: true,
    };
  }

  async logout(user, token) {
    const payload = this.jwtService.verify(token);

    const index = user.sessions.indexOf(payload.sessionId);
    user.sessions.splice(index, 1);

    await user.save();

    return {
      data: {},
      message: 'Logged out successfully, current session deleted.',
      success: true,
    };
  }

  async changePassword(user, newPass, currentPass) {
    const match = await bcrypt.compare(currentPass, user.password);

    if (match) {
      user.password = await bcrypt.hash(newPass || 'qwerty', 12);
      user.sessions = [];
      await user.save();
      return {
        data: {},
        message: 'Password changed successfully.',
        success: true,
      };
    } else {
      throw new HttpException(
        'Current password is incorrect!',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
