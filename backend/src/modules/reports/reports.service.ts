import { Injectable } from '@nestjs/common';
import { ComparisonResultEntity } from '../history/entities/comparison-result.entity';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReportsService {
  private readonly reportsDir: string;

  constructor(configService: ConfigService) {
    this.reportsDir = configService.get<string>('REPORTS_DIR', path.resolve(process.cwd(), 'storage/reports'));
  }

  async generateExcel(result: ComparisonResultEntity): Promise<string> {
    await fs.mkdir(this.reportsDir, { recursive: true });
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Comparación');

    const documentHeaders = result.documents.map((doc) => doc.originalName || doc.filename);
    sheet.addRow(['Campo', ...documentHeaders, 'Estado', 'Crítico']);

    result.result.forEach((field) => {
      const values = result.documents.map((doc) => field.values[doc.id] ?? '');
      sheet.addRow([field.label ?? field.field, ...values, field.status, field.critical ? 'Sí' : 'No']);
    });

    const filePath = path.join(this.reportsDir, `comparacion-${result.id}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  async generatePdf(result: ComparisonResultEntity): Promise<string> {
    await fs.mkdir(this.reportsDir, { recursive: true });
    const filePath = path.join(this.reportsDir, `comparacion-${result.id}.pdf`);
    const doc = new PDFDocument({ margin: 30 });
    const stream = createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).text('Reporte de Comparación', { underline: true });
    doc.moveDown();

    result.result.forEach((field) => {
      doc.fontSize(12).text(`Campo: ${field.label ?? field.field}`);
      result.documents.forEach((document) => {
        doc.text(`- ${document.originalName || document.filename}: ${field.values[document.id] ?? ''}`);
      });
      doc.text(`Estado: ${field.status}${field.critical ? ' (Crítico)' : ''}`);
      doc.moveDown();
    });

    doc.end();
    await new Promise((resolve) => stream.on('finish', resolve));
    return filePath;
  }
}
