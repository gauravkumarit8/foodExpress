import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { decimalTransformer } from '../../../common/transformers/decimal.transformer';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuItems)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: decimalTransformer })
  price: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;
}
