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
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  ShareDto,
  SubmitAttemptDto,
  UpdateQuestionDto,
} from './dto';
import { JwtAuthGuard } from './auth/jwt.guard';
import { UserId } from './auth/user.decorator';
import { PermissionsGuard } from './rbac/permissions.guard';
import { RequirePermission } from './rbac/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExamsController {
  constructor(private exams: ExamsService) {}

  @Post('exams')
  @RequirePermission('exams:create')
  create(@UserId() userId: string, @Body() dto: CreateExamDto) {
    return this.exams.create(userId, dto);
  }

  @Get('exams')
  @RequirePermission('exams:view')
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

  // Take path — authenticated only (works for shared exams / limited roles).
  @Get('exams/:id')
  get(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getForTaking(userId, id);
  }

  @Get('exams/:id/full')
  @RequirePermission('exams:edit')
  getFull(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getFull(userId, id);
  }

  @Patch('exams/:id/questions/:qid')
  @RequirePermission('exams:edit')
  updateQuestion(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('qid') qid: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.exams.updateQuestion(userId, id, qid, dto);
  }

  @Post('exams/:id/questions/:qid/regenerate')
  @RequirePermission('exams:edit')
  regenerateQuestion(
    @UserId() userId: string,
    @Param('id') id: string,
    @Param('qid') qid: string,
  ) {
    return this.exams.regenerateQuestion(userId, id, qid);
  }

  @Post('exams/:id/publish')
  @RequirePermission('exams:edit')
  publish(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.publish(userId, id);
  }

  @Post('exams/:id/clone')
  @RequirePermission('exams:create')
  clone(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.clone(userId, id);
  }

  @Post('exams/:id/share')
  @RequirePermission('exams:edit')
  share(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: ShareDto,
  ) {
    return this.exams.setShared(userId, id, dto.enabled);
  }

  @Delete('exams/:id')
  @RequirePermission('exams:delete')
  remove(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.remove(userId, id);
  }

  // ----- attempts -----

  @Post('exams/:id/attempts')
  @RequirePermission('attempts:create')
  submit(
    @UserId() userId: string,
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.exams.submit(userId, id, dto.answers, dto.timeTakenSec ?? 0);
  }

  @Get('exams/:id/attempts')
  @RequirePermission('attempts:view')
  attempts(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.listAttempts(userId, id);
  }

  @Get('attempts/:id')
  @RequirePermission('attempts:view')
  result(@UserId() userId: string, @Param('id') id: string) {
    return this.exams.getResult(userId, id);
  }
}
