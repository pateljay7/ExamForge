import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  ShareDto,
  SubmitAttemptDto,
  UpdateQuestionDto,
} from './dto';
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

  // ----- profile / shared (before exams/:id to avoid shadowing) -----

  @Get('me/stats')
  stats(@UserId() userId: string) {
    return this.exams.getStats(userId);
  }

  @Get('shared/:code')
  resolveShared(@Param('code') code: string) {
    return this.exams.resolveShareCode(code);
  }

  // ----- single exam -----

  @Get('exams/:id')
  get(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getForTaking(userId, id);
  }

  @Get('exams/:id/full')
  getFull(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getFull(userId, id);
  }

  @Patch('exams/:id/questions/:qid')
  updateQuestion(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('qid') qid: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.exams.updateQuestion(userId, id, qid, dto);
  }

  @Post('exams/:id/questions/:qid/regenerate')
  regenerateQuestion(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('qid') qid: string,
  ) {
    return this.exams.regenerateQuestion(userId, id, qid);
  }

  @Post('exams/:id/publish')
  publish(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.publish(userId, id);
  }

  @Post('exams/:id/clone')
  clone(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.clone(userId, id);
  }

  @Post('exams/:id/share')
  share(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: ShareDto,
  ) {
    return this.exams.setShared(userId, id, dto.enabled);
  }

  // ----- attempts -----

  @Post('exams/:id/attempts')
  submit(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.exams.submit(userId, id, dto.answers, dto.timeTakenSec ?? 0);
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
