import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
import { RestaurantsService } from '../restaurants/restaurants.service';

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
  let restaurantsService: { getMenuItemsByIds: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    ordersRepo = createMockRepo();
    historyRepo = createMockRepo();
    ratingsRepo = createMockRepo();
    restaurantsService = { getMenuItemsByIds: jest.fn(), findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: ordersRepo },
        { provide: getRepositoryToken(OrderStatusHistory), useValue: historyRepo },
        { provide: getRepositoryToken(Rating), useValue: ratingsRepo },
        { provide: RestaurantsService, useValue: restaurantsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // The actual security fix: price comes from the real menu item, never
  // from whatever the client sent.
  describe('create (server-side pricing)', () => {
    const menuItem = {
      id: 'item-1',
      restaurantId: 'r1',
      name: 'Masala Dosa',
      price: '90.00', // TypeORM decimal columns come back as strings — deliberately testing that
      isAvailable: true,
    };

    it('prices the order from the real menu item, ignoring any client-supplied price', async () => {
      restaurantsService.getMenuItemsByIds.mockResolvedValue([menuItem]);
      ordersRepo.create = jest.fn((x) => x);

      // Note: no unitPrice field even sent — the DTO no longer accepts one.
      const result = await service.create('cust-1', {
        restaurantId: 'r1',
        items: [{ menuItemId: 'item-1', quantity: 3 }],
        deliveryAddress: 'Test St',
        deliveryLat: 1,
        deliveryLng: 1,
      } as any);

      expect(result.subtotal).toBe(270); // 90 * 3, from the DB, not the client
    });

    it('rejects an order for a menu item that does not exist', async () => {
      restaurantsService.getMenuItemsByIds.mockResolvedValue([]); // nothing found
      await expect(
        service.create('cust-1', {
          restaurantId: 'r1',
          items: [{ menuItemId: 'does-not-exist', quantity: 1 }],
          deliveryAddress: 'Test St',
          deliveryLat: 1,
          deliveryLng: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a menu item that belongs to a different restaurant', async () => {
      restaurantsService.getMenuItemsByIds.mockResolvedValue([
        { ...menuItem, restaurantId: 'some-other-restaurant' },
      ]);
      await expect(
        service.create('cust-1', {
          restaurantId: 'r1',
          items: [{ menuItemId: 'item-1', quantity: 1 }],
          deliveryAddress: 'Test St',
          deliveryLat: 1,
          deliveryLng: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an unavailable menu item', async () => {
      restaurantsService.getMenuItemsByIds.mockResolvedValue([
        { ...menuItem, isAvailable: false },
      ]);
      await expect(
        service.create('cust-1', {
          restaurantId: 'r1',
          items: [{ menuItemId: 'item-1', quantity: 1 }],
          deliveryAddress: 'Test St',
          deliveryLat: 1,
          deliveryLng: 1,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // This is the whole point of the state machine — protect it from ever
  // accepting an illegal jump, even after refactors.
  describe('updateStatus (state machine + authorization)', () => {
    const restaurant = { id: 'r1', ownerId: 'owner-1' };
    const baseOrder = { id: '1', restaurantId: 'r1', customerId: 'cust-1' };

    beforeEach(() => {
      restaurantsService.findOne.mockResolvedValue(restaurant);
    });

    it('allows the restaurant owner to move placed -> accepted', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PLACED });
      const result = await service.updateStatus('1', 'owner-1', OrderStatus.ACCEPTED);
      expect(result.status).toBe(OrderStatus.ACCEPTED);
      expect(historyRepo.save).toHaveBeenCalled();
    });

    it('rejects the customer trying to advance the order (only the restaurant can)', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PLACED });
      await expect(service.updateStatus('1', 'cust-1', OrderStatus.ACCEPTED)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects a completely unrelated user touching the order at all', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PLACED });
      await expect(
        service.updateStatus('1', 'total-stranger', OrderStatus.CANCELLED),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the customer to cancel their own order', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PLACED });
      await expect(
        service.updateStatus('1', 'cust-1', OrderStatus.CANCELLED),
      ).resolves.toBeDefined();
    });

    it('allows the restaurant owner to cancel too', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PLACED });
      await expect(
        service.updateStatus('1', 'owner-1', OrderStatus.CANCELLED),
      ).resolves.toBeDefined();
    });

    it('rejects placed -> delivered (skipping every state in between)', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PLACED });
      await expect(
        service.updateStatus('1', 'owner-1', OrderStatus.DELIVERED),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects any transition out of delivered (terminal state)', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.DELIVERED });
      await expect(
        service.updateStatus('1', 'owner-1', OrderStatus.ACCEPTED),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cancelling from picked_up (too late in the flow)', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PICKED_UP });
      await expect(
        service.updateStatus('1', 'owner-1', OrderStatus.CANCELLED),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for a missing order', async () => {
      ordersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateStatus('missing', 'owner-1', OrderStatus.ACCEPTED),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects setting picked_up directly through the general status endpoint', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.READY });
      await expect(
        service.updateStatus('1', 'owner-1', OrderStatus.PICKED_UP),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects setting delivered directly through the general status endpoint', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.PICKED_UP });
      await expect(
        service.updateStatus('1', 'owner-1', OrderStatus.DELIVERED),
      ).rejects.toThrow(BadRequestException);
    });

    it('markPickedUp (called by DeliveryService) can reach picked_up where updateStatus cannot', async () => {
      ordersRepo.findOne.mockResolvedValue({ ...baseOrder, status: OrderStatus.READY });
      const result = await service.markPickedUp('1');
      expect(result.status).toBe(OrderStatus.PICKED_UP);
    });

    it('markDelivered still enforces the underlying state machine', async () => {
      ordersRepo.findOne.mockResolvedValue({ id: '1', status: OrderStatus.READY }); // not picked_up yet
      await expect(service.markDelivered('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOrderForUser (view authorization)', () => {
    const restaurant = { id: 'r1', ownerId: 'owner-1' };
    const order = { id: 'o1', restaurantId: 'r1', customerId: 'cust-1' };

    it('allows the customer who placed the order to view it', async () => {
      ordersRepo.findOne.mockResolvedValue(order);
      await expect(service.getOrderForUser('o1', 'cust-1')).resolves.toEqual(order);
    });

    it('allows the restaurant owner to view it', async () => {
      ordersRepo.findOne.mockResolvedValue(order);
      restaurantsService.findOne.mockResolvedValue(restaurant);
      await expect(service.getOrderForUser('o1', 'owner-1')).resolves.toEqual(order);
    });

    it('rejects a stranger — this is the actual security fix', async () => {
      ordersRepo.findOne.mockResolvedValue(order);
      restaurantsService.findOne.mockResolvedValue(restaurant);
      await expect(service.getOrderForUser('o1', 'random-other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findForRestaurant (the actual fix — restaurants could not see their own orders before)', () => {
    const restaurant = { id: 'r1', ownerId: 'owner-1' };

    it('returns orders for the restaurant when called by its actual owner', async () => {
      restaurantsService.findOne.mockResolvedValue(restaurant);
      ordersRepo.find.mockResolvedValue([{ id: 'o1' }, { id: 'o2' }]);
      const result = await service.findForRestaurant('r1', 'owner-1');
      expect(result).toHaveLength(2);
    });

    it('rejects anyone who is not the restaurant owner', async () => {
      restaurantsService.findOne.mockResolvedValue(restaurant);
      await expect(service.findForRestaurant('r1', 'someone-else')).rejects.toThrow(
        ForbiddenException,
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
