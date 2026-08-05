import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../users/auth/jwt-auth.guard';

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('riders/available')
  availableRiders() {
    return this.deliveryService.findAvailableRiders();
  }

  @Post('assign')
  assign(@Body('orderId') orderId: string, @Body('riderId') riderId: string) {
    return this.deliveryService.assign(orderId, riderId);
  }

  @Patch(':orderId/picked-up')
  pickedUp(@Param('orderId') orderId: string) {
    return this.deliveryService.markPickedUp(orderId);
  }

  @Patch(':orderId/delivered')
  delivered(@Param('orderId') orderId: string) {
    return this.deliveryService.markDelivered(orderId);
  }
}
