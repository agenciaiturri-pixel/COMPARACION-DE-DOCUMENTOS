import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparisonResultEntity } from './entities/comparison-result.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(ComparisonResultEntity)
    private readonly historyRepository: Repository<ComparisonResultEntity>
  ) {}

  async save(result: Partial<ComparisonResultEntity>): Promise<ComparisonResultEntity> {
    const entity = this.historyRepository.create(result);
    const saved = await this.historyRepository.save(entity);
    const withRelations = await this.findOne(saved.id);
    return withRelations ?? saved;
  }

  async findAll(): Promise<ComparisonResultEntity[]> {
    return this.historyRepository.find({ relations: ['documents'], order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ComparisonResultEntity | null> {
    return this.historyRepository.findOne({ where: { id }, relations: ['documents'] });
  }
}
