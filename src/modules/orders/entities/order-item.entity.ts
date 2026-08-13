import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'menu_item_id' })
  menuItemId: string;

  // Snapshot of the item's name at order time — deliberately NOT a live
  // join to MenuItem. Without this, renaming (or eventually deleting) a
  // menu item would retroactively change how every past order displays.
  // Nullable at the DB level: added after rows already existed in this
  // table, and Postgres can't add a NOT NULL column without a default to a
  // non-empty table. OrdersService.create() always sets this for new rows —
  // only pre-existing rows (from before this fix) will ever be null.
  @Column({ name: 'menu_item_name', nullable: true })
  menuItemName: string;

  @Column()
  quantity: number;

  @Column('decimal', { name: 'unit_price', precision: 10, scale: 2, transformer: decimalTransformer })
  unitPrice: number;

  @Column({ nullable: true })
  notes: string;
}
