import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'city_id' })
  cityId: string;

  @Column({ nullable: true })
  address: string;

  @Column('double precision')
  latitude: number;

  @Column('double precision')
  longitude: number;

  @Column({ name: 'is_open', default: true })
  isOpen: boolean;

  @Column({ name: 'avg_prep_time_minutes', default: 20 })
  avgPrepTimeMinutes: number;

  // Fix: no way to show a restaurant's cover photo/logo — every listing
  // screen would need a placeholder forever without this.
  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @OneToMany(() => MenuItem, (item) => item.restaurant)
  menuItems: MenuItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
