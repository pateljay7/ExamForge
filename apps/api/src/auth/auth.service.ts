import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { LoginDto, SignupDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: await bcrypt.hash(dto.password, 10),
        roleId: await this.roleIdForNewUser(),
      },
    });
    return this.sign(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // Backfill role for accounts created before RBAC existed.
    if (!user.roleId) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { roleId: await this.roleIdForNewUser() },
      });
    }
    return this.sign(user.id);
  }

  // First account (or any account while no Admin exists) becomes Admin.
  private async roleIdForNewUser(): Promise<string> {
    const adminExists =
      (await this.prisma.user.count({ where: { role: { name: 'Admin' } } })) > 0;
    const role = await this.prisma.role.findUnique({
      where: { name: adminExists ? 'User' : 'Admin' },
    });
    return role!.id;
  }

  // Current user + role — used to re-hydrate the client on load so a stale
  // cached session (or a role change) reflects without a re-login.
  async me(userId: string) {
    return { user: await this.userPayload(userId) };
  }

  private async userPayload(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    return {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role
        ? {
            name: user!.role.name,
            isSystem: user!.role.isSystem,
            permissions: user!.role.permissions,
          }
        : null,
    };
  }

  private async sign(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const token = this.jwt.sign({ sub: user!.id, email: user!.email });
    return { token, user: await this.userPayload(userId) };
  }
}
