import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rider } from './entities/rider.entity';
import { DeliveryAssignment } from './entities/delivery-assignment.entity';

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
