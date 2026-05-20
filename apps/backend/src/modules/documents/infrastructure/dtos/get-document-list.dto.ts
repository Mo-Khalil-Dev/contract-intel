import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetDocumentListDto {
  @ApiPropertyOptional({ description: 'Case-insensitive name search', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({ enum: ['all', 'high', 'medium', 'low'], default: 'all' })
  @IsOptional()
  @IsEnum(['all', 'high', 'medium', 'low'])
  risk?: 'all' | 'high' | 'medium' | 'low';

  @ApiPropertyOptional({
    enum: ['all', 'vendor', 'license', 'partnership', 'customer', 'lease', 'nda', 'other'],
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['all', 'vendor', 'license', 'partnership', 'customer', 'lease', 'nda', 'other'])
  type?: string;

  @ApiPropertyOptional({ enum: ['risk', 'date', 'name'], default: 'risk' })
  @IsOptional()
  @IsEnum(['risk', 'date', 'name'])
  sort?: 'risk' | 'date' | 'name';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
