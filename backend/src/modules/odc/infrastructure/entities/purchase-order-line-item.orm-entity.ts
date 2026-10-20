import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseOrderOrmEntity } from './purchase-order.orm-entity';

@Entity('purchase_order_items')
@Index('IDX_purchase_order_items_order_position', ['orderId', 'position'], {
  unique: true,
})
export class PurchaseOrderLineItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => PurchaseOrderOrmEntity, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order?: PurchaseOrderOrmEntity;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ type: 'int' })
  unitPriceCents: number;
}
