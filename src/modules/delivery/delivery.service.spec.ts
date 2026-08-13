import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { Rider } from './entities/rider.entity';
import { DeliveryAssignment } from './entities/delivery-assignment.entity';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

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
  let ordersService: { findOne: jest.Mock; markPickedUp: jest.Mock; markDelivered: jest.Mock };

  beforeEach(async () => {
    ridersRepo = createMockRepo();
    assignmentsRepo = createMockRepo();
    ordersService = {
      findOne: jest.fn(),
      markPickedUp: jest.fn(),
      markDelivered: jest.fn(),
    };

    // Fake transaction: just runs the callback with a manager whose
    // getRepository(DeliveryAssignment) returns the same mocked repo — good
    // enough to unit test the orchestration logic without a real DB.
    const mockDataSource = {
      transaction: jest.fn(async (cb: any) =>
        cb({ getRepository: () => assignmentsRepo }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: getRepositoryToken(Rider), useValue: ridersRepo },
        { provide: getRepositoryToken(DeliveryAssignment), useValue: assignmentsRepo },
        { provide: OrdersService, useValue: ordersService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
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

  describe('assign', () => {
    it('rejects assigning a rider before the order is ready', async () => {
      ordersService.findOne.mockResolvedValue({ id: 'o1', status: OrderStatus.PREPARING });
      await expect(service.assign('o1', 'rider-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects assigning a rider ID that does not exist — this is the actual fix', async () => {
      ordersService.findOne.mockResolvedValue({ id: 'o1', status: OrderStatus.READY });
      ridersRepo.findOne.mockResolvedValue(null); // no such rider
      await expect(service.assign('o1', 'fake-rider-id')).rejects.toThrow(NotFoundException);
    });

    it('rejects assigning a rider who is currently offline', async () => {
      ordersService.findOne.mockResolvedValue({ id: 'o1', status: OrderStatus.READY });
      ridersRepo.findOne.mockResolvedValue({ id: 'rider-1', isActive: false });
      await expect(service.assign('o1', 'rider-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects a second assignment for the same order', async () => {
      ordersService.findOne.mockResolvedValue({ id: 'o1', status: OrderStatus.READY });
      ridersRepo.findOne.mockResolvedValue({ id: 'rider-1', isActive: true });
      assignmentsRepo.findOne.mockResolvedValue({ id: 'existing-assignment' });
      await expect(service.assign('o1', 'rider-1')).rejects.toThrow(ConflictException);
    });

    it('creates the assignment once the order is ready, the rider is real and active, and unassigned', async () => {
      ordersService.findOne.mockResolvedValue({ id: 'o1', status: OrderStatus.READY });
      ridersRepo.findOne.mockResolvedValue({ id: 'rider-1', isActive: true });
      assignmentsRepo.findOne.mockResolvedValue(null);
      const result = await service.assign('o1', 'rider-1');
      expect(result.riderId).toBe('rider-1');
      expect(assignmentsRepo.save).toHaveBeenCalled();
    });
  });

  describe('markPickedUp / markDelivered', () => {
    const assignment = { id: 'a1', orderId: 'o1', riderId: 'rider-profile-1' };
    const assignedRider = { id: 'rider-profile-1', userId: 'rider-user-1' };

    it('markPickedUp advances the order status before stamping the timestamp', async () => {
      assignmentsRepo.findOne.mockResolvedValue(assignment);
      ridersRepo.findOne.mockResolvedValue(assignedRider);
      await service.markPickedUp('o1', 'rider-user-1');
      expect(ordersService.markPickedUp).toHaveBeenCalledWith('o1', expect.anything());
      expect(assignmentsRepo.save).toHaveBeenCalled();
    });

    it('markPickedUp throws if no assignment exists yet', async () => {
      assignmentsRepo.findOne.mockResolvedValue(null);
      await expect(service.markPickedUp('o1', 'rider-user-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(ordersService.markPickedUp).not.toHaveBeenCalled();
    });

    it('rejects a rider who is not the one actually assigned to this delivery', async () => {
      assignmentsRepo.findOne.mockResolvedValue(assignment);
      ridersRepo.findOne.mockResolvedValue(assignedRider); // belongs to rider-user-1
      await expect(service.markPickedUp('o1', 'some-other-rider')).rejects.toThrow(
        ForbiddenException,
      );
      expect(ordersService.markPickedUp).not.toHaveBeenCalled();
    });

    it('markDelivered propagates a state-machine violation instead of silently stamping the timestamp', async () => {
      assignmentsRepo.findOne.mockResolvedValue(assignment);
      ridersRepo.findOne.mockResolvedValue(assignedRider);
      ordersService.markDelivered.mockRejectedValue(new BadRequestException('not picked up yet'));
      await expect(service.markDelivered('o1', 'rider-user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(assignmentsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findMyAssignments (the actual fix — riders had no way to see what they were assigned)', () => {
    it('returns assignments scoped to the calling rider', async () => {
      ridersRepo.findOne.mockResolvedValue({ id: 'rider-profile-1', userId: 'rider-user-1' });
      assignmentsRepo.find.mockResolvedValue([{ id: 'a1' }]);
      const result = await service.findMyAssignments('rider-user-1');
      expect(result).toHaveLength(1);
      expect(assignmentsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { riderId: 'rider-profile-1' } }),
      );
    });

    it('throws if the account has no rider profile yet', async () => {
      ridersRepo.findOne.mockResolvedValue(null);
      await expect(service.findMyAssignments('not-a-rider')).rejects.toThrow(NotFoundException);
    });
  });
});