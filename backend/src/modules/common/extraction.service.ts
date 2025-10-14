import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as pdfParse from 'pdf-parse';
import { parse as parseCsv } from 'csv-parse';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

export type ExtractedFields = Record<string, string | number | null>;

const STANDARD_FIELDS: ExtractedFields = {
  exportador: '',
  consignatario: '',
  puerto_origen: '',
  puerto_destino: '',
  numero_contenedor: '',
  peso: '',
  cantidad: '',
  valor: '',
  incoterms: '',
  descripcion_mercaderia: ''
};

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  async extractFields(file: Express.Multer.File): Promise<ExtractedFields> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return this.extractFromPdf(file);
      case 'csv':
        return this.extractFromCsv(file);
      case 'xlsx':
      case 'xls':
        return this.extractFromXlsx(file);
      case 'docx':
        return this.extractFromDocx(file);
      default:
        return this.extractUsingOcr(file);
    }
  }

  private async extractFromPdf(file: Express.Multer.File): Promise<ExtractedFields> {
    try {
      const parsed = await pdfParse(file.buffer);
      return this.mapRawText(parsed.text);
    } catch (error) {
      this.logger.error('Error al analizar PDF', error as Error);
      return { ...STANDARD_FIELDS };
    }
  }

  private async extractUsingOcr(file: Express.Multer.File): Promise<ExtractedFields> {
    try {
      const result = await Tesseract.recognize(file.buffer, 'spa+eng');
      return this.mapRawText(result.data.text ?? '');
    } catch (error) {
      this.logger.error('Error en OCR', error as Error);
      return { ...STANDARD_FIELDS };
    }
  }

  private async extractFromCsv(file: Express.Multer.File): Promise<ExtractedFields> {
    return new Promise((resolve) => {
      parseCsv(
        file.buffer,
        { columns: true, skip_empty_lines: true },
        (err, records: Record<string, string>[]) => {
          if (err || !records.length) {
            return resolve({ ...STANDARD_FIELDS });
          }
          resolve(this.normalizeRecord(records[0]));
        }
      );
    });
  }

  private async extractFromXlsx(file: Express.Multer.File): Promise<ExtractedFields> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    return json.length ? this.normalizeRecord(json[0]) : { ...STANDARD_FIELDS };
  }

  private async extractFromDocx(file: Express.Multer.File): Promise<ExtractedFields> {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return this.mapRawText(result.value);
  }

  private normalizeRecord(record: Record<string, string>): ExtractedFields {
    const fields = { ...STANDARD_FIELDS };
    for (const key of Object.keys(fields)) {
      fields[key] = record[key] ?? record[key.toUpperCase()] ?? '';
    }
    return fields;
  }

  private mapRawText(text: string): ExtractedFields {
    const normalized = { ...STANDARD_FIELDS };
    const lower = text.toLowerCase();

    Object.keys(normalized).forEach((field) => {
      const match = lower.match(new RegExp(`${field.replace('_', ' ')}[:|-]?\\s*(.*)`, 'i'));
      normalized[field] = match ? match[1].split('\n')[0].trim() : '';
    });

    return normalized;
  }
}
