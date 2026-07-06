import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

// Usage: @RequirePermission('exams:create')
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
