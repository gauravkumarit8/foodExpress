import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'restaurant_rating' })
  restaurantRating: number;

  @Column({ name: 'rider_rating', nullable: true })
  riderRating: number;

  @Column({ nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
