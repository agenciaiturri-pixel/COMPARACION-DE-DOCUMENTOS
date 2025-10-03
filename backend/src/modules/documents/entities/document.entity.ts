import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { UserEntity } from '../../auth/user.entity';

export enum DocumentType {
  BILL_OF_LADING = 'BILL_OF_LADING',
  INVOICE = 'INVOICE',
  GUIDE = 'GUIDE',
  DAM = 'DAM',
  SENASA = 'SENASA',
  OTHER = 'OTHER'
}

@Entity({ name: 'documents' })
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  mimeType?: string | null;

  @Column({ type: 'integer', nullable: true })
  size?: number | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @Column({ type: 'jsonb', nullable: true })
  extractedFields: Record<string, any> | null;

  @Column({ nullable: true })
  storagePath: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  uploadedBy?: UserEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
