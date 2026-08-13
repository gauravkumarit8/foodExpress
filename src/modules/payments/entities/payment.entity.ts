import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalTransformer })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column()
  provider: string;

  @Column({ name: 'provider_txn_id', nullable: true })
  providerTxnId: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
