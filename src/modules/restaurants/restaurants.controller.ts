import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../users/auth/jwt-auth.guard';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  // IMPORTANT: this must be registered before @Get(':id') below — routes are
  // matched in registration order, so 'mine' would otherwise be swallowed by
  // the :id pattern and treated as a lookup for a restaurant named "mine".
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  findMine(@Req() req: any) {
    return this.restaurantsService.findMine(req.user.userId);
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
  create(@Req() req: any, @Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/menu-items')
  createMenuItem(@Req() req: any, @Param('id') id: string, @Body() dto: CreateMenuItemDto) {
    return this.restaurantsService.createMenuItem(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/menu-items/:itemId')
  updateMenuItem(
    @Req() req: any,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.restaurantsService.updateMenuItem(id, itemId, req.user.userId, dto);
  }
}
