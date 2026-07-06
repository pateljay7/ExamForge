import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UserId } from '../auth/user.decorator';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './permissions.decorator';
import { RolesService } from './roles.service';
import { UsersService } from './users.service';
import { LLM_PROVIDERS } from '../llm/llm.types';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  UpdateSettingsDto,
} from './rbac.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private roles: RolesService) {}

  @Get('catalog')
  @RequirePermission('roles:view')
  catalog() {
    return this.roles.catalog();
  }

  @Get()
  @RequirePermission('roles:view')
  list() {
    return this.roles.list();
  }

  @Post()
  @RequirePermission('roles:create')
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @RequirePermission('roles:edit')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('roles:delete')
  remove(@Param('id') id: string) {
    return this.roles.remove(id);
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @RequirePermission('users:view')
  list() {
    return this.users.list();
  }

  @Patch(':id/role')
  @RequirePermission('users:edit')
  assignRole(
    @UserId() actingUserId: string,
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.users.assignRole(actingUserId, id, dto.roleId);
  }

  @Delete(':id')
  @RequirePermission('users:delete')
  remove(@UserId() actingUserId: string, @Param('id') id: string) {
    return this.users.remove(actingUserId, id);
  }
}

// Self-service — authenticated only, no permission gate.
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private users: UsersService) {}

  @Get('settings')
  async settings(@UserId() userId: string) {
    const s = await this.users.getSettings(userId);
    return { llmProvider: s?.llmProvider ?? 'claude', providers: LLM_PROVIDERS };
  }

  @Patch('settings')
  update(@UserId() userId: string, @Body() dto: UpdateSettingsDto) {
    return this.users.updateSettings(userId, dto.llmProvider);
  }
}
