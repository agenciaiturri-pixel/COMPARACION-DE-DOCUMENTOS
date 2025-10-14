import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { ComparisonResultEntity } from './entities/comparison-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComparisonResultEntity])],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService]
})
export class HistoryModule {}
