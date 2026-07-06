import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  ADMIN_PERMISSIONS,
  PERMISSION_CATALOG,
  sanitizePermissions,
  USER_PERMISSIONS,
} from './permissions.constants';
import { CreateRoleDto, UpdateRoleDto } from './rbac.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  // Seed the two predefined, locked roles on startup.
  async onModuleInit() {
    await this.prisma.role.upsert({
      where: { name: 'Admin' },
      update: { permissions: ADMIN_PERMISSIONS, isSystem: true },
      create: { name: 'Admin', isSystem: true, permissions: ADMIN_PERMISSIONS },
    });
    await this.prisma.role.upsert({
      where: { name: 'User' },
      update: { isSystem: true },
      create: { name: 'User', isSystem: true, permissions: USER_PERMISSIONS },
    });
  }

  catalog() {
    return PERMISSION_CATALOG;
  }

  list() {
    return this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        isSystem: true,
        permissions: true,
        _count: { select: { users: true } },
      },
    });
  }

  async create(dto: CreateRoleDto) {
    const exists = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (exists) throw new ConflictException('A role with that name exists');
    return this.prisma.role.create({
      data: {
        name: dto.name.trim(),
        isSystem: false,
        permissions: sanitizePermissions(dto.permissions),
      },
    });
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new ForbiddenException('Predefined roles cannot be edited');
    }
    return this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.permissions && {
          permissions: sanitizePermissions(dto.permissions),
        }),
      },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      throw new ForbiddenException('Predefined roles cannot be deleted');
    }
    // Move any members to the default User role before deleting.
    const userRole = await this.prisma.role.findUnique({
      where: { name: 'User' },
    });
    if (!userRole) throw new BadRequestException('Default User role missing');
    await this.prisma.user.updateMany({
      where: { roleId: id },
      data: { roleId: userRole.id },
    });
    await this.prisma.role.delete({ where: { id } });
    return { id };
  }
}
