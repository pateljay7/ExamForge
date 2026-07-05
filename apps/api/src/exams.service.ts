import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AiService } from './ai.service';
import { CreateExamDto, AnswerDto } from './dto';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async create(userId: string, dto: CreateExamDto) {
    const generated = await this.ai.generateForSections(
      dto.sections,
      dto.numQuestions,
      dto.difficulty,
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
        timeLimitSec,
        timerEnabled,
        questions: {
          create: generated.map((q, i) => ({
            order: i,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        },
      },
    });

    return { id: exam.id, title: exam.title, difficulty: exam.difficulty };
  }

  list(userId: string) {
    return this.prisma.exam.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        difficulty: true,
        createdAt: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });
  }

  // Exam for taking — correctIndex omitted; scoped to owner.
  async getForTaking(userId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        difficulty: true,
        timeLimitSec: true,
        timerEnabled: true,
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, text: true, options: true },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async submit(
    userId: string,
    examId: string,
    answers: AnswerDto[],
    timeTakenSec: number,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, userId },
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

  async listAttempts(userId: string, examId: string) {
    return this.prisma.attempt.findMany({
      where: { examId, userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, score: true, total: true, createdAt: true },
    });
  }

  // Full result with correct answers — only after submission, owner only.
  async getResult(userId: string, attemptId: string) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        exam: {
          select: {
            title: true,
            difficulty: true,
            timeLimitSec: true,
            timerEnabled: true,
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
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
      questions: attempt.exam.questions.map((q) => {
        const selectedIndex = selectedById.has(q.id)
          ? selectedById.get(q.id)
          : null;
        return {
          id: q.id,
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          selectedIndex,
          isCorrect: selectedIndex === q.correctIndex,
        };
      }),
    };
  }
}
