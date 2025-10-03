import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn
} from 'typeorm';
import { DocumentEntity } from '../../documents/entities/document.entity';

export interface FieldComparison {
  field: string;
  label: string;
  values: Record<string, string | number | null>;
  status: 'MATCH' | 'DIFFERENT' | 'MISSING';
  critical?: boolean;
}

@Entity({ name: 'comparison_results' })
export class ComparisonResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => DocumentEntity)
  @JoinTable()
  documents: DocumentEntity[];

  @Column({ type: 'jsonb' })
  result: FieldComparison[];

  @Column({ type: 'boolean', default: false })
  hasCriticalAlerts: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
