import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
  ) {}

  create(dto: CreateRestaurantDto): Promise<Restaurant> {
    const restaurant = this.restaurantsRepository.create(dto);
    return this.restaurantsRepository.save(restaurant);
  }

  findAll(): Promise<Restaurant[]> {
    // TODO: replace with a real geo-radius query (PostGIS ST_DWithin) once
    // there are enough restaurants for distance filtering to matter.
    return this.restaurantsRepository.find({ where: { isOpen: true } });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async getMenu(id: string): Promise<MenuItem[]> {
    await this.findOne(id);
    return this.menuItemsRepository.find({ where: { restaurantId: id } });
  }

  async createMenuItem(restaurantId: string, dto: CreateMenuItemDto): Promise<MenuItem> {
    await this.findOne(restaurantId); // 404s if the restaurant doesn't exist
    const item = this.menuItemsRepository.create({ ...dto, restaurantId });
    return this.menuItemsRepository.save(item);
  }

  async updateMenuItem(restaurantId: string, itemId: string, dto: UpdateMenuItemDto): Promise<MenuItem> {
    const item = await this.menuItemsRepository.findOne({ where: { id: itemId, restaurantId } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }
    Object.assign(item, dto);
    return this.menuItemsRepository.save(item);
  }
}
