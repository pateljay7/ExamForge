import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
        _count: { select: { exams: true, attempts: true } },
      },
    });
  }

  async assignRole(actingUserId: string, userId: string, roleId: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      }),
      this.prisma.role.findUnique({ where: { id: roleId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!role) throw new NotFoundException('Role not found');

    // Never leave the system without an Admin.
    if (user.role?.name === 'Admin' && role.name !== 'Admin') {
      await this.assertNotLastAdmin(userId);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      select: {
        id: true,
        email: true,
        name: true,
        role: { select: { id: true, name: true } },
      },
    });
  }

  async remove(actingUserId: string, userId: string) {
    if (actingUserId === userId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role?.name === 'Admin') await this.assertNotLastAdmin(userId);

    await this.prisma.user.delete({ where: { id: userId } });
    return { id: userId };
  }

  private async assertNotLastAdmin(userId: string) {
    const admins = await this.prisma.user.count({
      where: { role: { name: 'Admin' }, NOT: { id: userId } },
    });
    if (admins === 0) {
      throw new ForbiddenException('At least one Admin must remain');
    }
  }

  // Self-service settings (no permission gate).
  getSettings(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { llmProvider: true },
    });
  }

  updateSettings(userId: string, llmProvider: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { llmProvider },
      select: { llmProvider: true },
    });
  }
}
