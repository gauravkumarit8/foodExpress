import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rider } from './entities/rider.entity';
import { DeliveryAssignment } from './entities/delivery-assignment.entity';
import { CreateRiderDto } from './dto/create-rider.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Rider)
    private readonly ridersRepository: Repository<Rider>,
    @InjectRepository(DeliveryAssignment)
    private readonly assignmentsRepository: Repository<DeliveryAssignment>,
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
      isActive: true, // registers as online by default — can toggle via setActive
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

  // MVP scope: admin picks the rider manually from findAvailableRiders().
  // The real geo-matching/dispatch algorithm from the research doc (§8)
  // slots in here later, once there are enough riders to need it.
  assign(orderId: string, riderId: string): Promise<DeliveryAssignment> {
    const assignment = this.assignmentsRepository.create({ orderId, riderId });
    return this.assignmentsRepository.save(assignment);
  }

  async markPickedUp(orderId: string): Promise<DeliveryAssignment> {
    const assignment = await this.findByOrder(orderId);
    assignment.pickedUpAt = new Date();
    return this.assignmentsRepository.save(assignment);
  }

  async markDelivered(orderId: string): Promise<DeliveryAssignment> {
    const assignment = await this.findByOrder(orderId);
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