import { IsInt, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MAX_FILE_SIZE_BYTES } from '../../domain/value-objects/file-size.vo';

export class InitiateUploadDto {
  @ApiProperty({ example: 'acme-vendor-agreement.pdf' })
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: 1_500_000 })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  fileSize!: number;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(127)
  fileType!: string;
}

export class UploadResponseDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty({ enum: ['PUT'] })
  method!: 'PUT';

  @ApiProperty()
  expiresAt!: string;
}
