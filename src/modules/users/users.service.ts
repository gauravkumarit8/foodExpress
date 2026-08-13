import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: RegisterDto): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      // SelfRegisterableRole and UserRole share the same string values by
      // design (SelfRegisterableRole is just UserRole minus ADMIN) — this
      // cast is safe and is exactly what makes admin unreachable here.
      role: dto.role as UserRole | undefined,
    });
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Fix: previously any authenticated user could view any other user's
  // profile (email, phone) by ID — the password-hash fix alone didn't
  // address this, since the rest of the record was never the problem.
  // There's no legitimate cross-user need for this right now (restaurant
  // names/details come from the Restaurant entity, not a User lookup).
  async getProfileForUser(id: string, requesterId: string): Promise<User> {
    if (id !== requesterId) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.findById(id);
  }
}
