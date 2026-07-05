import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SectionDto {
  @IsString()
  @MinLength(20, { message: 'each section needs at least 20 characters' })
  content: string;

  @IsInt()
  @Min(1)
  @Max(100)
  weight: number;
}

export class CreateExamDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];

  @IsInt()
  @Min(1)
  @Max(50)
  numQuestions: number;

  @IsIn(['easy', 'medium', 'hard'])
  difficulty: string;

  // Preset countdown limit in minutes. Omit for no limit.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  timeLimitMinutes?: number;

  // Reference stopwatch — ignored when a time limit is set.
  @IsOptional()
  @IsBoolean()
  timerEnabled?: boolean;
}

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex: number;
}

export class SubmitAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  timeTakenSec?: number;
}
