import {
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(20, { message: 'content must be at least 20 characters' })
  content: string;

  @IsInt()
  @Min(1)
  @Max(50)
  numQuestions: number;

  @IsIn(['easy', 'medium', 'hard'])
  difficulty: string;
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
}
