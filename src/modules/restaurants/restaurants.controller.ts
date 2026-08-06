import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { JwtAuthGuard } from '../users/auth/jwt-auth.guard';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Get(':id/menu')
  getMenu(@Param('id') id: string) {
    return this.restaurantsService.getMenu(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/menu-items')
  createMenuItem(@Param('id') id: string, @Body() dto: CreateMenuItemDto) {
    return this.restaurantsService.createMenuItem(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/menu-items/:itemId')
  updateMenuItem(@Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: UpdateMenuItemDto) {
    return this.restaurantsService.updateMenuItem(id, itemId, dto);
  }
}