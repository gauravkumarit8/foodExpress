import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';

const createMockRepo = () => ({
  create: jest.fn((x) => x),
  save: jest.fn((x) => Promise.resolve({ id: 'generated-id', ...x })),
  find: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
});

describe('RestaurantsService', () => {
  let service: RestaurantsService;
  let restaurantsRepo: ReturnType<typeof createMockRepo>;
  let menuItemsRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    restaurantsRepo = createMockRepo();
    menuItemsRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestaurantsService,
        { provide: getRepositoryToken(Restaurant), useValue: restaurantsRepo },
        { provide: getRepositoryToken(MenuItem), useValue: menuItemsRepo },
      ],
    }).compile();

    service = module.get<RestaurantsService>(RestaurantsService);
  });

  describe('create', () => {
    it('sets ownerId from the authenticated caller, not from the DTO', async () => {
      const result = await service.create('owner-1', { name: 'Test Kitchen' } as any);
      expect(result.ownerId).toBe('owner-1');
    });
  });

  describe('ownership checks (createMenuItem / updateMenuItem)', () => {
    const restaurant = { id: 'r1', ownerId: 'owner-1' };

    it('allows the actual owner to add a menu item', async () => {
      restaurantsRepo.findOne.mockResolvedValue(restaurant);
      const result = await service.createMenuItem('r1', 'owner-1', { name: 'Dosa', price: 90 } as any);
      expect(result.restaurantId).toBe('r1');
    });

    it('rejects a different user adding a menu item to someone else\'s restaurant', async () => {
      restaurantsRepo.findOne.mockResolvedValue(restaurant);
      await expect(
        service.createMenuItem('r1', 'someone-else', { name: 'Dosa', price: 90 } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects updates from a non-owner too', async () => {
      restaurantsRepo.findOne.mockResolvedValue(restaurant);
      await expect(
        service.updateMenuItem('r1', 'item-1', 'someone-else', { price: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('404s if the restaurant does not exist at all', async () => {
      restaurantsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createMenuItem('missing', 'owner-1', { name: 'Dosa', price: 90 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMenuItemsByIds', () => {
    it('returns an empty array without querying for an empty id list', async () => {
      const result = await service.getMenuItemsByIds([]);
      expect(result).toEqual([]);
      expect(menuItemsRepo.findBy).not.toHaveBeenCalled();
    });

    it('queries the repository for a non-empty id list', async () => {
      menuItemsRepo.findBy.mockResolvedValue([{ id: 'item-1' }]);
      const result = await service.getMenuItemsByIds(['item-1']);
      expect(result).toHaveLength(1);
      expect(menuItemsRepo.findBy).toHaveBeenCalled();
    });
  });

  describe('findMine', () => {
    it('queries restaurants scoped to the given owner', async () => {
      restaurantsRepo.find.mockResolvedValue([{ id: 'r1', ownerId: 'owner-1' }]);
      const result = await service.findMine('owner-1');
      expect(result).toHaveLength(1);
      expect(restaurantsRepo.find).toHaveBeenCalledWith({ where: { ownerId: 'owner-1' } });
    });
  });

  describe('update', () => {
    const restaurant = { id: 'r1', ownerId: 'owner-1', name: 'Old Name', isOpen: true };

    it('allows the owner to update their restaurant', async () => {
      restaurantsRepo.findOne.mockResolvedValue(restaurant);
      const result = await service.update('r1', 'owner-1', { isOpen: false });
      expect(result.isOpen).toBe(false);
      expect(restaurantsRepo.save).toHaveBeenCalled();
    });

    it('rejects a non-owner trying to update the restaurant', async () => {
      restaurantsRepo.findOne.mockResolvedValue(restaurant);
      await expect(service.update('r1', 'someone-else', { isOpen: false })).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
