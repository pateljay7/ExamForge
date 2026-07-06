import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RolesService } from './roles.service';
import { UsersService } from './users.service';
import { PermissionsGuard } from './permissions.guard';
import {
  MeController,
  RolesController,
  UsersController,
} from './rbac.controller';

@Module({
  controllers: [RolesController, UsersController, MeController],
  providers: [PrismaService, RolesService, UsersService, PermissionsGuard],
})
export class RbacModule {}
