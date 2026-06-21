import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Request body for POST /api/v1/ask. Boundary validation only. */
export class AskRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  question!: string;

  /** Continue an existing thread. Omit to start a new one. */
  @IsOptional()
  @IsUUID()
  threadId?: string;
}
