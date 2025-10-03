import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { HistoryService } from '../history/history.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly historyService: HistoryService
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/excel')
  async downloadExcel(@Param('id') id: string, @Res() res: Response) {
    const comparison = await this.historyService.findOne(id);
    if (!comparison) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    const filePath = await this.reportsService.generateExcel(comparison);
    return res.download(filePath);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const comparison = await this.historyService.findOne(id);
    if (!comparison) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    const filePath = await this.reportsService.generatePdf(comparison);
    return res.download(filePath);
  }
}
