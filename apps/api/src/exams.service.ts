import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from './prisma.service';
import { AiService } from './ai.service';
import { AnswerDto, CreateExamDto, UpdateQuestionDto } from './dto';

type Section = { title?: string; content: string; weight: number };

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async create(userId: string, dto: CreateExamDto) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { llmProvider: true },
    });
    const generated = await this.ai.generateForSections(
      dto.sections,
      dto.numQuestions,
      dto.difficulty,
      me?.llmProvider,
    );

    const timeLimitSec = dto.timeLimitMinutes
      ? dto.timeLimitMinutes * 60
      : null;
    // Stopwatch only applies when there's no preset limit.
    const timerEnabled = timeLimitSec ? false : !!dto.timerEnabled;

    const exam = await this.prisma.exam.create({
      data: {
        userId,
        title: dto.title,
        sections: dto.sections as any,
        difficulty: dto.difficulty,
        status: 'draft', // review & publish before taking
        tags: (dto.tags ?? []).map((t) => t.trim()).filter(Boolean),
        timeLimitSec,
        timerEnabled,
        shuffleQuestions: !!dto.shuffleQuestions,
        shuffleOptions: !!dto.shuffleOptions,
        questions: {
          create: generated.map((q, i) => ({
            order: i,
            sectionIndex: q.sectionIndex,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        },
      },
    });

    return { id: exam.id, title: exam.title, status: exam.status };
  }

  list(userId: string) {
    return this.prisma.exam.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        difficulty: true,
        status: true,
        tags: true,
        isShared: true,
        shareCode: true,
        createdAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  // ---------- draft editing ----------

  // Full exam incl. correct answers — owner only, for the edit page.
  async getFull(userId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        difficulty: true,
        status: true,
        sections: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            sectionIndex: true,
            text: true,
            options: true,
            correctIndex: true,
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async updateQuestion(
    userId: string,
    examId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ) {
    await this.assertOwner(userId, examId);
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, examId },
    });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        ...(dto.text !== undefined && { text: dto.text }),
        ...(dto.options !== undefined && { options: dto.options }),
        ...(dto.correctIndex !== undefined && {
          correctIndex: dto.correctIndex,
        }),
      },
      select: {
        id: true,
        sectionIndex: true,
        text: true,
        options: true,
        correctIndex: true,
      },
    });
  }

  async regenerateQuestion(userId: string, examId: string, questionId: string) {
    const exam = await this.assertOwner(userId, examId);
    const question = await this.prisma.question.findFirst({
      where: { id: questionId, examId },
    });
    if (!question) throw new NotFoundException('Question not found');

    const sections = exam.sections as unknown as Section[];
    const section = sections[question.sectionIndex] ?? sections[0];
    const [siblings, me] = await Promise.all([
      this.prisma.question.findMany({
        where: { examId, NOT: { id: questionId } },
        select: { text: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { llmProvider: true },
      }),
    ]);

    const [fresh] = await this.ai.generateQuestions(
      section.content,
      1,
      exam.difficulty,
      siblings.map((s) => s.text),
      me?.llmProvider,
    );

    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: fresh.text,
        options: fresh.options,
        correctIndex: fresh.correctIndex,
      },
      select: {
        id: true,
        sectionIndex: true,
        text: true,
        options: true,
        correctIndex: true,
      },
    });
  }

  async publish(userId: string, examId: string) {
    await this.assertOwner(userId, examId);
    await this.prisma.exam.update({
      where: { id: examId },
      data: { status: 'published' },
    });
    return { id: examId, status: 'published' };
  }

  // ---------- clone / share ----------

  async clone(userId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const copy = await this.prisma.exam.create({
      data: {
        userId,
        title: `${exam.title} (Copy)`,
        sections: exam.sections as any,
        difficulty: exam.difficulty,
        status: 'draft', // clones start as drafts for tweaking
        tags: exam.tags as any,
        timeLimitSec: exam.timeLimitSec,
        timerEnabled: exam.timerEnabled,
        shuffleQuestions: exam.shuffleQuestions,
        shuffleOptions: exam.shuffleOptions,
        questions: {
          create: exam.questions.map((q) => ({
            order: q.order,
            sectionIndex: q.sectionIndex,
            text: q.text,
            options: q.options as any,
            correctIndex: q.correctIndex,
          })),
        },
      },
    });
    return { id: copy.id, title: copy.title, status: copy.status };
  }

  async setShared(userId: string, examId: string, enabled: boolean) {
    const exam = await this.assertOwner(userId, examId);
    const shareCode =
      exam.shareCode ?? randomBytes(6).toString('base64url'); // 8 chars
    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { isShared: enabled, shareCode },
      select: { isShared: true, shareCode: true },
    });
    return updated;
  }

  async resolveShareCode(code: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { shareCode: code, isShared: true, status: 'published' },
      select: { id: true, title: true },
    });
    if (!exam) throw new NotFoundException('Shared exam not found');
    return exam;
  }

  // ---------- taking ----------

  // Exam for taking — correctIndex omitted. Owner or shared-with-anyone.
  async getForTaking(userId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: {
        id,
        OR: [{ userId }, { isShared: true }],
      },
      select: {
        id: true,
        userId: true,
        title: true,
        difficulty: true,
        status: true,
        timeLimitSec: true,
        timerEnabled: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, text: true, options: true },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    if (exam.status !== 'published') {
      if (exam.userId !== userId) throw new NotFoundException('Exam not found');
      // Owner hitting a draft — return a stub so the client redirects to edit.
      return { id: exam.id, title: exam.title, status: exam.status, isOwner: true };
    }

    const { userId: ownerId, ...rest } = exam;
    return { ...rest, isOwner: ownerId === userId };
  }

  async submit(
    userId: string,
    examId: string,
    answers: AnswerDto[],
    timeTakenSec: number,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: {
        id: examId,
        status: 'published',
        OR: [{ userId }, { isShared: true }],
      },
      select: {
        questions: { select: { id: true, correctIndex: true } },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const correctById = new Map(
      exam.questions.map((q) => [q.id, q.correctIndex]),
    );
    let score = 0;
    for (const a of answers) {
      if (correctById.get(a.questionId) === a.selectedIndex) score++;
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        examId,
        userId,
        answers: answers as any,
        score,
        total: exam.questions.length,
        timeTakenSec: Math.max(0, Math.round(timeTakenSec) || 0),
      },
    });
    return { attemptId: attempt.id };
  }

  // Own attempts on an exam (works for shared takers too).
  listAttempts(userId: string, examId: string) {
    return this.prisma.attempt.findMany({
      where: { examId, userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, score: true, total: true, timeTakenSec: true, createdAt: true },
    });
  }

  // ---------- results ----------

  async getResult(userId: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        exam: {
          select: {
            title: true,
            difficulty: true,
            sections: true,
            timeLimitSec: true,
            timerEnabled: true,
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                sectionIndex: true,
                text: true,
                options: true,
                correctIndex: true,
              },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const selectedById = new Map(
      (attempt.answers as any[]).map((a) => [a.questionId, a.selectedIndex]),
    );

    const sections = attempt.exam.sections as unknown as Section[];
    const breakdown = sections.map((s, i) => ({
      title: s.title?.trim() || `Section ${i + 1}`,
      weight: s.weight,
      correct: 0,
      total: 0,
    }));

    const questions = attempt.exam.questions.map((q) => {
      const selectedIndex = selectedById.has(q.id)
        ? selectedById.get(q.id)
        : null;
      const isCorrect = selectedIndex === q.correctIndex;
      const b = breakdown[q.sectionIndex] ?? breakdown[0];
      if (b) {
        b.total++;
        if (isCorrect) b.correct++;
      }
      return {
        id: q.id,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex,
        isCorrect,
      };
    });

    return {
      id: attempt.id,
      title: attempt.exam.title,
      difficulty: attempt.exam.difficulty,
      score: attempt.score,
      total: attempt.total,
      timeTakenSec: attempt.timeTakenSec,
      timeLimitSec: attempt.exam.timeLimitSec,
      timerEnabled: attempt.exam.timerEnabled,
      createdAt: attempt.createdAt,
      sectionBreakdown: breakdown.filter((b) => b.total > 0),
      questions,
    };
  }

  // ---------- profile ----------

  async getStats(userId: string) {
    const [examCount, attempts, recent] = await Promise.all([
      this.prisma.exam.count({ where: { userId } }),
      this.prisma.attempt.findMany({
        where: { userId },
        select: { score: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          score: true,
          total: true,
          timeTakenSec: true,
          createdAt: true,
          exam: { select: { id: true, title: true } },
        },
      }),
    ]);

    const pcts = attempts.map((a) => (a.total ? a.score / a.total : 0));
    const avgScore = pcts.length
      ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100)
      : 0;
    const bestScore = pcts.length
      ? Math.round(Math.max(...pcts) * 100)
      : 0;

    // Streak: consecutive days (ending today or yesterday) with ≥1 attempt.
    const days = new Set(
      attempts.map((a) => a.createdAt.toISOString().slice(0, 10)),
    );
    const dayStr = (offset: number) =>
      new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    let streak = 0;
    let offset = days.has(dayStr(0)) ? 0 : days.has(dayStr(1)) ? 1 : -1;
    if (offset >= 0) {
      while (days.has(dayStr(offset + streak))) streak++;
    }

    return {
      examCount,
      attemptCount: attempts.length,
      avgScore,
      bestScore,
      streak,
      recent,
    };
  }

  // ---------- helpers ----------

  async remove(userId: string, examId: string) {
    await this.assertOwner(userId, examId);
    await this.prisma.exam.delete({ where: { id: examId } });
    return { id: examId };
  }

  private async assertOwner(userId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }
}
