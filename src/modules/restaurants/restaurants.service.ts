import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

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
}
