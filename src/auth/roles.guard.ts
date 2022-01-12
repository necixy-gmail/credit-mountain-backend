import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const userRoles = {};
    user.roles.forEach((element) => {
      userRoles[element] = true;
    });
    let permission = false;

    for (let i = 0; i < requiredRoles.length; i++) {
      if (userRoles[requiredRoles[i]]) {
        permission = true;
        break;
      }
    }

    return permission;
  }
}
