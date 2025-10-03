import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DocumentEntity, DocumentType } from './entities/document.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { ExtractionService } from '../common/extraction.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepository: Repository<DocumentEntity>,
    private readonly extractionService: ExtractionService,
    configService: ConfigService
  ) {
    this.uploadDir = configService.get<string>('UPLOAD_DIR', path.resolve(process.cwd(), 'storage/uploads'));
  }

  async saveFile(buffer: Buffer, originalName: string): Promise<{ storedName: string; storedPath: string }> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const safeName = `${randomUUID()}-${originalName
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9.\-]+/g, '_')}`;
    const storedPath = path.join(this.uploadDir, safeName);
    await fs.writeFile(storedPath, buffer);
    return { storedName: safeName, storedPath };
  }

  async createDocument(
    file: Express.Multer.File,
    metadata: Partial<UploadDocumentDto> = {},
    userId?: string
  ): Promise<DocumentEntity> {
    const { storedName, storedPath } = await this.saveFile(file.buffer, file.originalname);
    const extractedFields = await this.extractionService.extractFields(file);
    const type = metadata.type && Object.values(DocumentType).includes(metadata.type as DocumentType)
      ? (metadata.type as DocumentType)
      : DocumentType.OTHER;
    const originalName = metadata.originalName?.trim() || file.originalname;
    const description = metadata.description?.trim();

    const document = this.documentsRepository.create({
      filename: storedName,
      originalName,
      mimeType: file.mimetype,
      size: file.size,
      description: description ?? null,
      type,
      extractedFields,
      storagePath: storedPath,
      uploadedBy: userId ? ({ id: userId } as any) : undefined
    });

    return this.documentsRepository.save(document);
  }

  async createMany(
    files: Express.Multer.File[],
    metadata: Partial<UploadDocumentDto>[] = [],
    userId?: string
  ): Promise<DocumentEntity[]> {
    if (!files.length) {
      throw new BadRequestException('No se enviaron archivos para subir');
    }

    const creations = files.map((file, index) => {
      const meta = metadata[index] ?? {};
      return this.createDocument(file, meta, userId);
    });

    return Promise.all(creations);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return this.documentsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByIds(ids: string[]): Promise<DocumentEntity[]> {
    const documents = await this.documentsRepository.find({ where: { id: In(ids) } });
    return ids
      .map((id) => documents.find((document) => document.id === id))
      .filter((document): document is DocumentEntity => Boolean(document));
  }
}
