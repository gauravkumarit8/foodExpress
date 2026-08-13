import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { CreateRiderDto } from './dto/create-rider.dto';
import { AssignDeliveryDto } from './dto/assign-delivery.dto';
import { JwtAuthGuard } from '../users/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('delivery')
@ApiBearerAuth()

@Controller('delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.RIDER, UserRole.ADMIN)
  @Post('riders')
  registerAsRider(@Req() req: any, @Body() dto: CreateRiderDto) {
    return this.deliveryService.register(req.user.userId, dto);
  }

  @Patch('riders/me/status')
  updateMyStatus(@Req() req: any, @Body('isActive') isActive: boolean) {
    return this.deliveryService.setActive(req.user.userId, isActive);
  }

  // Dispatch actions — matches the PRD's original MVP scope ("admin-managed"
  // rider assignment, not a customer/owner/rider self-service action).
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('riders/available')
  availableRiders() {
    return this.deliveryService.findAvailableRiders();
  }

  @Get('mine')
  findMyAssignments(@Req() req: any) {
    return this.deliveryService.findMyAssignments(req.user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('assign')
  assign(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assign(dto.orderId, dto.riderId);
  }

  @Patch(':orderId/picked-up')
  pickedUp(@Req() req: any, @Param('orderId') orderId: string) {
    return this.deliveryService.markPickedUp(orderId, req.user.userId);
  }

  @Patch(':orderId/delivered')
  delivered(@Req() req: any, @Param('orderId') orderId: string) {
    return this.deliveryService.markDelivered(orderId, req.user.userId);
  }
}
