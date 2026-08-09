import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Rating } from './entities/rating.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';

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

// Statuses settable through the general-purpose PATCH /orders/:id/status
// endpoint (restaurant/admin actions). picked_up and delivered are
// deliberately excluded from this set — those only happen as a side effect
// of the Delivery module's markPickedUp/markDelivered (see DeliveryService),
// so the order's own status and the actual delivery assignment can never
// drift apart the way they could before.
const PUBLICLY_SETTABLE_STATUSES = new Set<OrderStatus>([
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.CANCELLED,
]);

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepository: Repository<OrderStatusHistory>,
    @InjectRepository(Rating)
    private readonly ratingsRepository: Repository<Rating>,
    private readonly restaurantsService: RestaurantsService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<Order> {
    // Fix: price every item from the real menu record, never from client
    // input. Previously unitPrice came straight from the request body —
    // anyone could set it to anything they wanted.
    const requestedIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.restaurantsService.getMenuItemsByIds(requestedIds);
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));

    let subtotal = 0;
    const orderItems = dto.items.map((requested) => {
      const menuItem = menuItemsById.get(requested.menuItemId);
      if (!menuItem) {
        throw new BadRequestException(`Menu item ${requested.menuItemId} does not exist`);
      }
      if (menuItem.restaurantId !== dto.restaurantId) {
        throw new BadRequestException(
          `Menu item "${menuItem.name}" does not belong to the requested restaurant`,
        );
      }
      if (!menuItem.isAvailable) {
        throw new BadRequestException(`"${menuItem.name}" is currently unavailable`);
      }

      const realPrice = Number(menuItem.price); // real price from the DB, not the request
      subtotal += realPrice * requested.quantity;
      return {
        menuItemId: menuItem.id,
        quantity: requested.quantity,
        unitPrice: realPrice,
      };
    });

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
      items: orderItems,
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
    if (!PUBLICLY_SETTABLE_STATUSES.has(nextStatus)) {
      throw new BadRequestException(
        `"${nextStatus}" can't be set directly — it's driven by the delivery workflow ` +
          `(see the /delivery endpoints), not the general status endpoint.`,
      );
    }
    return this.transitionTo(id, nextStatus);
  }

  // Called by DeliveryService, not exposed on a public route directly — this
  // is what actually keeps the order's status and the delivery assignment's
  // timestamps in sync instead of two independently-mutable tracks.
  markPickedUp(id: string): Promise<Order> {
    return this.transitionTo(id, OrderStatus.PICKED_UP);
  }

  markDelivered(id: string): Promise<Order> {
    return this.transitionTo(id, OrderStatus.DELIVERED);
  }

  private async transitionTo(id: string, nextStatus: OrderStatus): Promise<Order> {
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

  async rateOrder(customerId: string, orderId: string, dto: CreateRatingDto): Promise<Rating> {
    const order = await this.findOne(orderId);

    if (order.customerId !== customerId) {
      throw new ForbiddenException('You can only rate your own orders');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be rated');
    }

    const existing = await this.ratingsRepository.findOne({ where: { orderId } });
    if (existing) {
      throw new ConflictException('This order has already been rated');
    }

    const rating = this.ratingsRepository.create({
      orderId,
      customerId,
      restaurantRating: dto.restaurantRating,
      riderRating: dto.riderRating,
      comment: dto.comment,
    });
    return this.ratingsRepository.save(rating);
  }

  private async logStatus(orderId: string, status: OrderStatus) {
    const entry = this.historyRepository.create({ orderId, status });
    await this.historyRepository.save(entry);
  }
}
