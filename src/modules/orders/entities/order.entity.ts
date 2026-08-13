import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum OrderStatus {
  PLACED = 'placed',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PLACED })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalTransformer })
  subtotal: number;

  @Column('decimal', { name: 'delivery_fee', precision: 10, scale: 2, transformer: decimalTransformer })
  deliveryFee: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalTransformer })
  total: number;

  @Column({ name: 'delivery_address' })
  deliveryAddress: string;

  @Column('double precision', { name: 'delivery_lat' })
  deliveryLat: number;

  @Column('double precision', { name: 'delivery_lng' })
  deliveryLng: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn({ name: 'placed_at' })
  placedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
