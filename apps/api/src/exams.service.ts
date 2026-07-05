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

  async create(dto: CreateExamDto) {
    const generated = await this.ai.generateQuestions(
      dto.content,
      dto.numQuestions,
      dto.difficulty,
    );

    const exam = await this.prisma.exam.create({
      data: {
        title: dto.title,
        content: dto.content,
        difficulty: dto.difficulty,
        questions: {
          create: generated.map((q, i) => ({
            order: i,
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
          })),
        },
      },
      include: { _count: { select: { questions: true } } },
    });

    return { id: exam.id, title: exam.title, difficulty: exam.difficulty };
  }

  list() {
    return this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        difficulty: true,
        createdAt: true,
        _count: { select: { questions: true } },
      },
    });
  }

  // Exam for taking — correctIndex omitted.
  async getForTaking(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        difficulty: true,
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, text: true, options: true },
        },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async submit(examId: string, answers: AnswerDto[]) {
    const questions = await this.prisma.question.findMany({
      where: { examId },
      select: { id: true, correctIndex: true },
    });
    if (!questions.length) throw new NotFoundException('Exam not found');

    const correctById = new Map(questions.map((q) => [q.id, q.correctIndex]));
    let score = 0;
    for (const a of answers) {
      if (correctById.get(a.questionId) === a.selectedIndex) score++;
    }

    const attempt = await this.prisma.attempt.create({
      data: {
        examId,
        answers: answers as any,
        score,
        total: questions.length,
      },
    });
    return { attemptId: attempt.id };
  }

  listAttempts(examId: string) {
    return this.prisma.attempt.findMany({
      where: { examId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, score: true, total: true, createdAt: true },
    });
  }

  // Full result with correct answers — only after submission.
  async getResult(attemptId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: {
            title: true,
            questions: {
              orderBy: { order: 'asc' },
              select: { id: true, text: true, options: true, correctIndex: true },
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
      score: attempt.score,
      total: attempt.total,
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
