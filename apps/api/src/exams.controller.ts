import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto, SubmitAttemptDto } from './dto';
import { JwtAuthGuard } from './auth/jwt.guard';
import { UserId } from './auth/user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private exams: ExamsService) {}

  @Post('exams')
  create(@UserId() userId: string, @Body() dto: CreateExamDto) {
    return this.exams.create(userId, dto);
  }

  @Get('exams')
  list(@UserId() userId: string) {
    return this.exams.list(userId);
  }

  @Get('exams/:id')
  get(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getForTaking(userId, id);
  }

  @Post('exams/:id/attempts')
  submit(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.exams.submit(userId, id, dto.answers);
  }

  @Get('exams/:id/attempts')
  attempts(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.listAttempts(userId, id);
  }

  @Get('attempts/:id')
  result(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getResult(userId, id);
  }
}
