import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../users/infrastructure/entities/user.orm-entity';
import type { OdcStatus } from '../../domain/entities/purchase-order.entity';
import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';

@Entity('odc_status_history')
export class OdcStatusHistoryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  odcId: string;

  @ManyToOne(() => PurchaseOrderOrmEntity)
  @JoinColumn({ name: 'odcId' })
  odc?: PurchaseOrderOrmEntity;

  @Column({ type: 'varchar', nullable: true })
  fromStatus: OdcStatus | null;

  @Column({ type: 'varchar' })
  toStatus: OdcStatus;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'userId' })
  user?: UserOrmEntity;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
