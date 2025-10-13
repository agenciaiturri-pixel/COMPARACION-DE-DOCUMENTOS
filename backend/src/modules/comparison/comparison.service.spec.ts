import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { DocumentsService } from '../documents/documents.service';
import { HistoryService } from '../history/history.service';
import { DocumentEntity, DocumentType } from '../documents/entities/document.entity';
import { ComparisonResultEntity } from '../history/entities/comparison-result.entity';

const buildDocument = (id: string, fields: Record<string, any>): DocumentEntity => ({
  id,
  filename: `${id}.pdf`,
  originalName: `${id}.pdf`,
  type: DocumentType.OTHER,
  storagePath: null,
  extractedFields: fields,
  createdAt: new Date(),
  updatedAt: new Date()
} as unknown as DocumentEntity);

describe('ComparisonService', () => {
  let comparisonService: ComparisonService;
  let documentsService: jest.Mocked<DocumentsService>;
  let historyService: jest.Mocked<HistoryService>;

  beforeEach(() => {
    documentsService = {
      findByIds: jest.fn()
    } as unknown as jest.Mocked<DocumentsService>;

    historyService = {
      save: jest.fn()
    } as unknown as jest.Mocked<HistoryService>;

    historyService.save.mockImplementation(async (payload) => ({
      id: 'comparison-id',
      createdAt: new Date(),
      documents: payload.documents ?? [],
      result: payload.result ?? [],
      hasCriticalAlerts: payload.hasCriticalAlerts ?? false
    }) as ComparisonResultEntity);

    comparisonService = new ComparisonService(documentsService, historyService);
  });

  it('throws when no documents were found', async () => {
    documentsService.findByIds.mockResolvedValue([]);

    await expect(
      comparisonService.compare({ documentIds: ['doc-1', 'doc-2'] })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when there are fewer than two documents', async () => {
    documentsService.findByIds.mockResolvedValue([buildDocument('doc-1', {})]);

    await expect(
      comparisonService.compare({ documentIds: ['doc-1'] })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('flags critical differences across documents', async () => {
    const documents = [
      buildDocument('doc-1', { peso: '100' }),
      buildDocument('doc-2', { peso: '120' })
    ];

    documentsService.findByIds.mockResolvedValue(documents as any);

    const comparison = await comparisonService.compare({
      documentIds: ['doc-1', 'doc-2']
    });

    const pesoField = comparison.result.find((field) => field.field === 'peso');
    expect(pesoField?.status).toBe('DIFFERENT');
    expect(pesoField?.critical).toBe(true);

    expect(historyService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        hasCriticalAlerts: true
      })
    );
  });

  it('marks fields as missing when all documents lack values', async () => {
    const documents = [
      buildDocument('doc-1', { peso: null }),
      buildDocument('doc-2', { peso: null })
    ];

    documentsService.findByIds.mockResolvedValue(documents as any);

    const comparison = await comparisonService.compare({
      documentIds: ['doc-1', 'doc-2']
    });

    const pesoField = comparison.result.find((field) => field.field === 'peso');
    expect(pesoField?.status).toBe('MISSING');
    expect(pesoField?.critical).toBe(true);
  });
});
