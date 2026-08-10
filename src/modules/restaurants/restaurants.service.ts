import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
  ) {}

  create(ownerId: string, dto: CreateRestaurantDto): Promise<Restaurant> {
    // ownerId comes from the authenticated caller (JWT), never from the
    // request body — otherwise anyone could create a restaurant "owned" by
    // someone else's account.
    const restaurant = this.restaurantsRepository.create({ ...dto, ownerId });
    return this.restaurantsRepository.save(restaurant);
  }

  findAll(): Promise<Restaurant[]> {
    // TODO: replace with a real geo-radius query (PostGIS ST_DWithin) once
    // there are enough restaurants for distance filtering to matter.
    return this.restaurantsRepository.find({ where: { isOpen: true } });
  }

  // Fix: previously an owner had no way to find their own restaurant's ID
  // after creating it, short of scanning the public (open-only) listing.
  findMine(ownerId: string): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({ where: { ownerId } });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  // Fix: there was no way to edit a restaurant or toggle it open/closed
  // after creation at all.
  async update(id: string, ownerId: string, dto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.assertOwnership(id, ownerId);
    Object.assign(restaurant, dto);
    return this.restaurantsRepository.save(restaurant);
  }

  async getMenu(id: string): Promise<MenuItem[]> {
    await this.findOne(id);
    return this.menuItemsRepository.find({ where: { restaurantId: id } });
  }

  // Used by OrdersService to price an order from real data instead of
  // trusting whatever the client claims an item costs.
  getMenuItemsByIds(ids: string[]): Promise<MenuItem[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.menuItemsRepository.findBy({ id: In(ids) });
  }

  async createMenuItem(
    restaurantId: string,
    ownerId: string,
    dto: CreateMenuItemDto,
  ): Promise<MenuItem> {
    await this.assertOwnership(restaurantId, ownerId);
    const item = this.menuItemsRepository.create({ ...dto, restaurantId });
    return this.menuItemsRepository.save(item);
  }

  async updateMenuItem(
    restaurantId: string,
    itemId: string,
    ownerId: string,
    dto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    await this.assertOwnership(restaurantId, ownerId);
    const item = await this.menuItemsRepository.findOne({ where: { id: itemId, restaurantId } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    Object.assign(item, dto);
    return this.menuItemsRepository.save(item);
  }

  // The core of fix #2: any write scoped to a restaurant checks the caller
  // actually owns it first. Previously any authenticated user could edit
  // any restaurant's menu.
  private async assertOwnership(restaurantId: string, ownerId: string): Promise<Restaurant> {
    const restaurant = await this.findOne(restaurantId);
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    return restaurant;
  }
}
