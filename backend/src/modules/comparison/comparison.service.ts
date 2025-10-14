import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { HistoryService } from '../history/history.service';
import { RunComparisonDto } from './dto/run-comparison.dto';
import { FieldComparison } from '../history/entities/comparison-result.entity';

const FIELD_LABELS: Record<string, string> = {
  exportador: 'Exportador',
  consignatario: 'Consignatario',
  puerto_origen: 'Puerto de origen',
  puerto_destino: 'Puerto de destino',
  numero_contenedor: 'Número de contenedor',
  peso: 'Peso',
  cantidad: 'Cantidad',
  valor: 'Valor',
  incoterms: 'Incoterms',
  descripcion_mercaderia: 'Descripción de mercadería'
};

const FIELDS = Object.keys(FIELD_LABELS);

const CRITICAL_FIELDS = ['numero_contenedor', 'peso', 'valor'];

@Injectable()
export class ComparisonService {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly historyService: HistoryService
  ) {}

  async compare(dto: RunComparisonDto) {
    const documents = await this.documentsService.findByIds(dto.documentIds);
    if (!documents.length) {
      throw new NotFoundException('No se encontraron documentos para comparar');
    }
    if (documents.length !== dto.documentIds.length) {
      throw new NotFoundException('Algunos documentos solicitados no existen');
    }
    if (documents.length < 2) {
      throw new BadRequestException('Se requieren al menos dos documentos para comparar');
    }

    const result: FieldComparison[] = FIELDS.map((field) => {
      const values: Record<string, string | number | null> = {};
      let status: FieldComparison['status'] = 'MATCH';
      let previousValue: string | number | null | undefined;
      let hasMissing = false;

      for (const document of documents) {
        const value = document.extractedFields?.[field] ?? null;
        values[document.id] = value;
        if (value === null || value === '' || value === undefined) {
          hasMissing = true;
        }
        if (previousValue === undefined) {
          previousValue = value;
        } else if (value !== previousValue) {
          status = 'DIFFERENT';
        }
      }

      if (hasMissing && status !== 'DIFFERENT') {
        status = 'MISSING';
      }

      return {
        field,
        label: FIELD_LABELS[field] ?? field,
        values,
        status,
        critical: CRITICAL_FIELDS.includes(field) && status !== 'MATCH'
      };
    });

    const comparison = await this.historyService.save({
      documents,
      result,
      hasCriticalAlerts: result.some((item) => item.critical)
    });

    if (comparison.documents?.length) {
      comparison.documents = documents
        .map((doc) => comparison.documents.find((item) => item.id === doc.id) ?? doc)
        .filter((item): item is typeof documents[number] => Boolean(item));
    }

    return comparison;
  }
}
