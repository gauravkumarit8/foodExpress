import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../users/auth/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get('orders/:id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrderForUser(id, req.user.userId);
  }

  @Get('users/me/orders')
  findMine(@Req() req: any, @Query() pagination: PaginationDto) {
    return this.ordersService.findForCustomer(req.user.userId, pagination);
  }

  @Get('restaurants/:restaurantId/orders')
  findForRestaurant(
    @Req() req: any,
    @Param('restaurantId') restaurantId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.ordersService.findForRestaurant(restaurantId, req.user.userId, pagination);
  }

  @Patch('orders/:id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, req.user.userId, status);
  }

  @Post('orders/:id/rating')
  rateOrder(@Req() req: any, @Param('id') id: string, @Body() dto: CreateRatingDto) {
    return this.ordersService.rateOrder(req.user.userId, id, dto);
  }
}
