import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from 'src/config/config.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      usernameField: 'email',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ConfigService.keys.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.getUserApp(
      { _id: payload.sub, role: payload.role },
      {},
    );

    if (!user) {
      throw new HttpException('User does not exist!', HttpStatus.UNAUTHORIZED);
    }

    if (!user.sessions.includes(payload.sessionId)) {
      throw new HttpException(
        'Your session expired! Please, login again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
