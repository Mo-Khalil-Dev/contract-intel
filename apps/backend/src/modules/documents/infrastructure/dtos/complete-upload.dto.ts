import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteUploadDto {
  @ApiProperty()
  @IsUUID()
  documentId!: string;
}

export class UploadStatusDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty({ enum: ['pending', 'uploading', 'complete', 'failed'] })
  status!: 'pending' | 'uploading' | 'complete' | 'failed';

  @ApiProperty({ nullable: true })
  uploadedAt!: string | null;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;
}
