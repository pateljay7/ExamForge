import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { AuthModule } from './auth/auth.module';
import { LlmModule } from './llm/llm.module';
import { RbacModule } from './rbac/rbac.module';
import { PermissionsGuard } from './rbac/permissions.guard';

@Module({
  imports: [AuthModule, LlmModule, RbacModule],
  controllers: [ExamsController],
  providers: [PrismaService, ExamsService, PermissionsGuard],
})
export class AppModule {}
