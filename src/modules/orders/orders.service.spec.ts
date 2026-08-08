import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Rating } from './entities/rating.entity';

const createMockRepo = () => ({
  create: jest.fn((x) => x),
  save: jest.fn((x) => Promise.resolve({ id: 'generated-id', ...x })),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepo: ReturnType<typeof createMockRepo>;
  let historyRepo: ReturnType<typeof createMockRepo>;
  let ratingsRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    ordersRepo = createMockRepo();
    historyRepo = createMockRepo();
    ratingsRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: ordersRepo },
        { provide: getRepositoryToken(OrderStatusHistory), useValue: historyRepo },
        { provide: getRepositoryToken(Rating), useValue: ratingsRepo },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('updateStatus (state machine)', () => {
    it('allows placed -> accepted', async () => {
      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.PLACED });
      const result = await service.updateStatus('1', OrderStatus.ACCEPTED);
      expect(result.status).toBe(OrderStatus.ACCEPTED);
      expect(historyRepo.save).toHaveBeenCalled();
    });

    it('rejects placed -> delivered (skipping every state in between)', async () => {
      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.PLACED });
      await expect(service.updateStatus('1', OrderStatus.DELIVERED)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects any transition out of delivered (terminal state)', async () => {
      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.DELIVERED });
      await expect(service.updateStatus('1', OrderStatus.ACCEPTED)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects any transition out of cancelled (terminal state)', async () => {
      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.CANCELLED });
      await expect(service.updateStatus('1', OrderStatus.ACCEPTED)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows cancelling from placed, but not from picked_up', async () => {
      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.PLACED });
      await expect(service.updateStatus('1', OrderStatus.CANCELLED)).resolves.toBeDefined();

      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.PICKED_UP });
      await expect(service.updateStatus('1', OrderStatus.CANCELLED)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException for a missing order', async () => {
      ordersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateStatus('missing', OrderStatus.ACCEPTED)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rateOrder', () => {
    const deliveredOrder = { id: 'o1', customerId: 'cust-1', status: OrderStatus.DELIVERED };

    it('rejects rating from a different customer', async () => {
      ordersRepo.findOne.mockResolvedValue(deliveredOrder);
      await expect(
        service.rateOrder('someone-else', 'o1', { restaurantRating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects rating an order that is not yet delivered', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...deliveredOrder, status: OrderStatus.PREPARING });
      await expect(service.rateOrder('cust-1', 'o1', { restaurantRating: 5 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a second rating on the same order', async () => {
      ordersRepo.findOne.mockResolvedValue(deliveredOrder);
      ratingsRepo.findOne.mockResolvedValue({ id: 'existing-rating' });
      await expect(service.rateOrder('cust-1', 'o1', { restaurantRating: 5 })).rejects.toThrow(
        ConflictException,
      );
    });

    it('saves a valid rating', async () => {
      ordersRepo.findOne.mockResolvedValue(deliveredOrder);
      ratingsRepo.findOne.mockResolvedValue(null);
      const result = await service.rateOrder('cust-1', 'o1', {
        restaurantRating: 5,
        comment: 'Great!',
      });
      expect(ratingsRepo.save).toHaveBeenCalled();
      expect(result.restaurantRating).toBe(5);
    });
  });
});