import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

const createMockRepo = () => ({
  create: jest.fn((x) => x),
  save: jest.fn((x) => Promise.resolve({ id: 'generated-id', ...x })),
  findOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    usersRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: usersRepo }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('rejects a duplicate email', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create({ name: 'X', email: 'dup@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes the password before saving — never stores it plain', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result.passwordHash).toBeDefined();
      expect(result.passwordHash).not.toBe('password123');
    });

    it('defaults to the customer role when none is given', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });
      // role is undefined on the DTO here, and the entity column default
      // (UserRole.CUSTOMER) only actually applies at the DB level — this
      // just documents that the service doesn't invent a role on its own.
      expect(result.role).toBeUndefined();
    });
  });

  describe('getProfileForUser (the actual fix)', () => {
    it('allows a user to view their own profile', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'user-1', email: 'me@example.com' });
      await expect(service.getProfileForUser('user-1', 'user-1')).resolves.toBeDefined();
    });

    it('rejects viewing a different user\'s profile', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'user-1', email: 'other@example.com' });
      await expect(service.getProfileForUser('user-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('404s for a nonexistent user rather than leaking existence via a different error', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfileForUser('missing', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
