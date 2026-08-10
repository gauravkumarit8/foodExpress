import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT_OWNER = 'restaurant_owner',
  RIDER = 'rider',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  // Excluded at the entity level (rather than remembering to strip it in
  // every controller) so ANY endpoint that ever returns a User — now or
  // added later — can't accidentally leak the bcrypt hash. Requires the
  // global ClassSerializerInterceptor registered in main.ts to take effect.
  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ name: 'city_id', nullable: true })
  cityId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
