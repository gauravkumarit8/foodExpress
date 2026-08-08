import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Rider } from './entities/rider.entity';
import { DeliveryAssignment } from './entities/delivery-assignment.entity';

const createMockRepo = () => ({
  create: jest.fn((x) => x),
  save: jest.fn((x) => Promise.resolve({ id: 'generated-id', ...x })),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('DeliveryService', () => {
  let service: DeliveryService;
  let ridersRepo: ReturnType<typeof createMockRepo>;
  let assignmentsRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    ridersRepo = createMockRepo();
    assignmentsRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: getRepositoryToken(Rider), useValue: ridersRepo },
        { provide: getRepositoryToken(DeliveryAssignment), useValue: assignmentsRepo },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
  });

  describe('register', () => {
    it('creates a rider profile, online by default', async () => {
      ridersRepo.findOne.mockResolvedValue(null);
      const result = await service.register('user-1', { vehicleType: 'bike' });
      expect(result.isActive).toBe(true);
      expect(ridersRepo.save).toHaveBeenCalled();
    });

    it('rejects registering the same account twice', async () => {
      ridersRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.register('user-1', {})).rejects.toThrow(ConflictException);
    });
  });

  describe('setActive', () => {
    it('toggles an existing rider offline', async () => {
      ridersRepo.findOne.mockResolvedValue({ id: 'r1', userId: 'user-1', isActive: true });
      const result = await service.setActive('user-1', false);
      expect(result.isActive).toBe(false);
    });

    it('throws NotFoundException if no rider profile exists for the account', async () => {
      ridersRepo.findOne.mockResolvedValue(null);
      await expect(service.setActive('user-1', true)).rejects.toThrow(NotFoundException);
    });
  });
});