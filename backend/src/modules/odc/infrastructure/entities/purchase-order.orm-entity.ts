import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../users/infrastructure/entities/user.orm-entity';
import type { OdcStatus } from '../../domain/entities/purchase-order.entity';

@Entity('purchase_orders')
export class PurchaseOrderOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  odcNumber: string;

  @Column({ type: 'varchar' })
  status: OdcStatus;

  @Column()
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column()
  unit: string;

  @Column({ type: 'int' })
  unitPriceCents: number;

  @Column({ type: 'int' })
  totalCents: number;

  @Column()
  supplier: string;

  @Column({ type: 'varchar', nullable: true })
  comments: string | null;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'createdById' })
  createdBy?: UserOrmEntity;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'date', nullable: true })
  paymentDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentMethod: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentReference: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentNotes: string | null;

  @Column({ type: 'varchar', nullable: true })
  paymentEvidenceFile: string | null;

  @Column({ type: 'varchar', nullable: true })
  evidenceReference: string | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceFile: string | null;

  @Column({ type: 'varchar', nullable: true })
  invoiceNumber: string | null;

  @Column({ type: 'date', nullable: true })
  invoiceDate: string | null;

  @Column({ type: 'date', nullable: true })
  warehouseEntryDate: string | null;

  @Column({ type: 'varchar', nullable: true })
  observations: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
