import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AiService } from './ai.service';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

@Module({
  controllers: [ExamsController],
  providers: [PrismaService, AiService, ExamsService],
})
export class AppModule {}
