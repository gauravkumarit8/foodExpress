import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';

// The state machine from the architecture doc, enforced in code rather than
// left as a free-text status column. No transition outside this map is legal.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
  [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepository: Repository<OrderStatusHistory>,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<Order> {
    // MVP skeleton: payment integration (charge-before-create, from the
    // architecture doc's order-placement sequence) plugs in right here,
    // between computing the total and saving the order.
    const subtotal = dto.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const deliveryFee = 30; // flat placeholder — replace with real pricing logic later
    const order = this.ordersRepository.create({
      customerId,
      restaurantId: dto.restaurantId,
      status: OrderStatus.PLACED,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      deliveryAddress: dto.deliveryAddress,
      deliveryLat: dto.deliveryLat,
      deliveryLng: dto.deliveryLng,
      items: dto.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    } as Partial<Order>);
    const saved = await this.ordersRepository.save(order);
    await this.logStatus(saved.id, OrderStatus.PLACED);
    return saved;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id }, relations: ['items'] });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  findForCustomer(customerId: string): Promise<Order[]> {
    return this.ordersRepository.find({ where: { customerId }, order: { placedAt: 'DESC' } });
  }

  async updateStatus(id: string, nextStatus: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot move order from "${order.status}" to "${nextStatus}"`,
      );
    }
    order.status = nextStatus;
    const saved = await this.ordersRepository.save(order);
    await this.logStatus(id, nextStatus);
    return saved;
  }

  private async logStatus(orderId: string, status: OrderStatus) {
    const entry = this.historyRepository.create({ orderId, status });
    await this.historyRepository.save(entry);
  }
}
