import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('riders')
export class Rider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ name: 'vehicle_type', nullable: true })
  vehicleType: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column('double precision', { name: 'current_lat', nullable: true })
  currentLat: number;

  @Column('double precision', { name: 'current_lng', nullable: true })
  currentLng: number;
}
