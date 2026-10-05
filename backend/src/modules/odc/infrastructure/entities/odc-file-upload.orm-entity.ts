import {
  Column,
  Entity,
  Index,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  UploadField,
  FileRecoveryOutcome,
} from '../../domain/repositories/purchase-order.repository';

@Entity('odc_file_uploads')
@Index('odc_file_uploads_due', ['state', 'nextAttemptAt'])
export class OdcFileUploadOrmEntity {
  @PrimaryColumn({ type: 'uuid' }) id: string;
  @Column({ type: 'uuid' }) orderId: string;
  @Column({ type: 'int' }) expectedVersion: number;
  @Column({ type: 'varchar' }) field: UploadField;
  @Column({ type: 'varchar', unique: true }) publicId: string;
  @Column({ type: 'varchar', default: 'pending' }) state:
    'pending' | 'cleaning' | 'retry' | 'associated' | 'done' | 'protected';
  @Column({ type: 'boolean', default: false }) uploadConfirmed: boolean;
  @Column({ type: 'int', default: 0 }) attempts: number;
  @Column({ type: 'varchar', nullable: true })
  lastOutcome: FileRecoveryOutcome | null;
  @Column({ type: 'timestamptz' }) nextAttemptAt: Date;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
