import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AiService } from './ai.service';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ExamsController],
  providers: [PrismaService, AiService, ExamsService],
})
export class AppModule {}
