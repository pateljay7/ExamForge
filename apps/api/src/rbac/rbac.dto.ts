import { IsIn, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsObject()
  permissions: Record<string, Record<string, boolean>>;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, Record<string, boolean>>;
}

export class AssignRoleDto {
  @IsString()
  roleId: string;
}

export class UpdateSettingsDto {
  @IsIn(['claude', 'gemini'])
  llmProvider: string;
}
