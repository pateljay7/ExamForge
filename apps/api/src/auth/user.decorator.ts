import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Returns the authenticated user's id (JWT `sub` claim).
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest().user.sub,
);
