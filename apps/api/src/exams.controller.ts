import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto, SubmitAttemptDto } from './dto';

@Controller()
export class ExamsController {
  constructor(private exams: ExamsService) {}

  @Post('exams')
  create(@Body() dto: CreateExamDto) {
    return this.exams.create(dto);
  }

  @Get('exams')
  list() {
    return this.exams.list();
  }

  @Get('exams/:id')
  get(@Param('id') id: string) {
    return this.exams.getForTaking(id);
  }

  @Post('exams/:id/attempts')
  submit(@Param('id') id: string, @Body() dto: SubmitAttemptDto) {
    return this.exams.submit(id, dto.answers);
  }

  @Get('exams/:id/attempts')
  attempts(@Param('id') id: string) {
    return this.exams.listAttempts(id);
  }

  @Get('attempts/:id')
  result(@Param('id') id: string) {
    return this.exams.getResult(id);
  }
}
