import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { sub?: string };
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('metadata') metadata?: string,
    @Req() request?: RequestWithUser
  ) {
    const parsedMetadata = this.parseMetadata(metadata, files.length);
    const userId = request?.user?.sub;
    return this.documentsService.createMany(files, parsedMetadata, userId);
  }

  private parseMetadata(metadata: string | undefined, totalFiles: number): Partial<UploadDocumentDto>[] {
    if (!metadata) {
      return Array.from({ length: totalFiles }, () => ({}));
    }

    try {
      const parsed = JSON.parse(metadata);
      if (!Array.isArray(parsed)) {
        throw new BadRequestException('La metadata de documentos debe ser un arreglo válido');
      }

      const items = parsed.map(
        (item) =>
          ({
            type: item?.type,
            originalName: item?.originalName,
            description: item?.description
          } as Partial<UploadDocumentDto>)
      );
      if (items.length < totalFiles) {
        const missing = totalFiles - items.length;
        for (let index = 0; index < missing; index++) {
          items.push({});
        }
      }
      return items.slice(0, totalFiles);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('No se pudo procesar la metadata de los documentos');
    }
  }
}
