import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '../entities/document.entity';

export class UploadDocumentDto {
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
