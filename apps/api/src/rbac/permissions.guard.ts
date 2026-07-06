import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { PERMISSION_KEY } from './permissions.decorator';
import { can, Permissions } from './permissions.constants';

// Runs after JwtAuthGuard. Loads the caller's role and checks the required
// permission (if the handler declared one via @RequirePermission).
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true; // authenticated-only route

    const req = ctx.switchToHttp().getRequest();
    const userId = req.user?.sub;
    const user = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          include: { role: true },
        })
      : null;

    const permissions = user?.role?.permissions as Permissions | undefined;
    if (!can(permissions, required)) {
      throw new ForbiddenException('You do not have permission for this action');
    }
    // Expose role on the request for downstream use.
    req.role = user?.role;
    return true;
  }
}
