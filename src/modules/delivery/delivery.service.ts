import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rider } from './entities/rider.entity';
import { DeliveryAssignment } from './entities/delivery-assignment.entity';
import { CreateRiderDto } from './dto/create-rider.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Rider)
    private readonly ridersRepository: Repository<Rider>,
    @InjectRepository(DeliveryAssignment)
    private readonly assignmentsRepository: Repository<DeliveryAssignment>,
    private readonly ordersService: OrdersService,
  ) {}

  findAvailableRiders(): Promise<Rider[]> {
    return this.ridersRepository.find({ where: { isActive: true } });
  }

  async register(userId: string, dto: CreateRiderDto): Promise<Rider> {
    const existing = await this.ridersRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('This account is already registered as a rider');
    }
    const rider = this.ridersRepository.create({
      userId,
      vehicleType: dto.vehicleType,
      isActive: true,
    });
    return this.ridersRepository.save(rider);
  }

  async setActive(userId: string, isActive: boolean): Promise<Rider> {
    const rider = await this.ridersRepository.findOne({ where: { userId } });
    if (!rider) {
      throw new NotFoundException('No rider profile for this account — register first');
    }
    rider.isActive = isActive;
    return this.ridersRepository.save(rider);
  }

  async assign(orderId: string, riderId: string): Promise<DeliveryAssignment> {
    // An order can only go to a rider once the kitchen has actually marked
    // it ready — otherwise you could assign someone to food that isn't made.
    const order = await this.ordersService.findOne(orderId);
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException(
        `Order must be "ready" before a rider can be assigned (currently "${order.status}")`,
      );
    }

    const existing = await this.assignmentsRepository.findOne({ where: { orderId } });
    if (existing) {
      throw new ConflictException('This order already has a rider assigned');
    }

    const assignment = this.assignmentsRepository.create({ orderId, riderId });
    return this.assignmentsRepository.save(assignment);
  }

  async markPickedUp(orderId: string): Promise<DeliveryAssignment> {
    const assignment = await this.findByOrder(orderId);
    // Drives the order's own status forward — this is the fix: the two
    // records can no longer disagree, because this is the only path to
    // OrderStatus.PICKED_UP.
    await this.ordersService.markPickedUp(orderId);
    assignment.pickedUpAt = new Date();
    return this.assignmentsRepository.save(assignment);
  }

  async markDelivered(orderId: string): Promise<DeliveryAssignment> {
    const assignment = await this.findByOrder(orderId);
    await this.ordersService.markDelivered(orderId);
    assignment.deliveredAt = new Date();
    return this.assignmentsRepository.save(assignment);
  }

  private async findByOrder(orderId: string): Promise<DeliveryAssignment> {
    const assignment = await this.assignmentsRepository.findOne({ where: { orderId } });
    if (!assignment) {
      throw new NotFoundException('No delivery assignment for this order');
    }
    return assignment;
  }
}