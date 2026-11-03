import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TASK_PRIORITIES, type TaskPriority } from '../task.entity.js';

/**
 * Every field optional: PATCH semantics. In a larger app, PartialType(CreateTaskDto) from
 * @nestjs/mapped-types (or @nestjs/swagger) derives this class and copies the validators.
 */
export class UpdateTaskDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: TaskPriority;

  @IsOptional()
  @IsBoolean()
  done?: boolean;
}
