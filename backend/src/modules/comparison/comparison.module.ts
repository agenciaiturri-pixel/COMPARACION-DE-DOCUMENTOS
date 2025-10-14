import { Module } from '@nestjs/common';
import { ComparisonService } from './comparison.service';
import { ComparisonController } from './comparison.controller';
import { DocumentsModule } from '../documents/documents.module';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [DocumentsModule, HistoryModule],
  controllers: [ComparisonController],
  providers: [ComparisonService]
})
export class ComparisonModule {}
