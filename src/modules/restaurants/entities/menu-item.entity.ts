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

  // Fix: nowhere to put a dish photo. A food-delivery UI without any
  // possible image is a real gap, not just polish — this is the field a
  // frontend/admin flow populates (with a URL from wherever images are
  // hosted; this project doesn't need to handle file upload itself for
  // that to work).
  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;
}
