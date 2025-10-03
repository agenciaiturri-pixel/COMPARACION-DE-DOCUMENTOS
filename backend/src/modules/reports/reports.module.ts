import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { HistoryModule } from '../history/history.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HistoryModule, ConfigModule],
  controllers: [ReportsController],
  providers: [ReportsService]
})
export class ReportsModule {}
