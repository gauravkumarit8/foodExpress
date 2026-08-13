/**
 * Populates the database with sample restaurants, menu items, and a
 * restaurant-owner test account so the API has real data to return instead
 * of empty arrays. Safe to re-run — skips anything that already exists.
 *
 * Usage: npm run seed
 */
import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { Restaurant } from '../modules/restaurants/entities/restaurant.entity';
import { MenuItem } from '../modules/restaurants/entities/menu-item.entity';
import { Order, OrderStatus } from '../modules/orders/entities/order.entity';
import { OrderItem } from '../modules/orders/entities/order-item.entity';
import { OrderStatusHistory } from '../modules/orders/entities/order-status-history.entity';
import { Payment, PaymentStatus } from '../modules/payments/entities/payment.entity';
import { Rider } from '../modules/delivery/entities/rider.entity';
import { DeliveryAssignment } from '../modules/delivery/entities/delivery-assignment.entity';

const dbUrl = process.env.DB_URL?.trim();
const sslEnabled = (process.env.DB_SSL ?? 'true').toLowerCase() === 'true' || (process.env.DB_SSL ?? 'true').toLowerCase() === '1';
const sslConfig = sslEnabled
  ? {
      rejectUnauthorized: false,
      servername: dbUrl ? new URL(dbUrl).hostname : (process.env.DB_HOST ?? 'localhost'),
    }
  : false;

const dataSource = new DataSource({
  type: 'postgres',
  ...(dbUrl
    ? { url: dbUrl, ssl: sslConfig }
    : {
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME ?? 'foodexpress',
        password: process.env.DB_PASSWORD ?? 'foodexpress',
        database: process.env.DB_NAME ?? 'foodexpress',
        ssl: sslConfig,
      }),
  entities: [
    User,
    Restaurant,
    MenuItem,
    Order,
    OrderItem,
    OrderStatusHistory,
    Payment,
    Rider,
    DeliveryAssignment,
  ],
  synchronize: false,
});

const CITY_ID = '00000000-0000-4000-8000-000000000001'; // placeholder single-city id

const sampleRestaurants = [
  {
    name: 'Spice Route Kitchen',
    description: 'South Indian comfort food',
    address: 'Indiranagar, Bengaluru',
    latitude: 12.9719,
    longitude: 77.6412,
    items: [
      { name: 'Masala Dosa', price: 90, category: 'Breakfast' },
      { name: 'Idli Sambar (4 pcs)', price: 70, category: 'Breakfast' },
      { name: 'Chicken Biryani', price: 220, category: 'Main' },
    ],
  },
  {
    name: 'Tandoor Nights',
    description: 'North Indian grill & curries',
    address: 'Koramangala, Bengaluru',
    latitude: 12.9352,
    longitude: 77.6245,
    items: [
      { name: 'Butter Chicken', price: 260, category: 'Main' },
      { name: 'Paneer Tikka', price: 210, category: 'Starter' },
      { name: 'Garlic Naan', price: 55, category: 'Bread' },
    ],
  },
  {
    name: 'Pizza & Pasta Co.',
    description: 'Wood-fired pizza and fresh pasta',
    address: 'HSR Layout, Bengaluru',
    latitude: 12.9121,
    longitude: 77.6446,
    items: [
      { name: 'Margherita Pizza', price: 240, category: 'Pizza' },
      { name: 'Penne Arrabbiata', price: 210, category: 'Pasta' },
      { name: 'Garlic Bread', price: 120, category: 'Sides' },
    ],
  },
];

async function seed() {
  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const restaurantRepo = dataSource.getRepository(Restaurant);
  const menuRepo = dataSource.getRepository(MenuItem);
  const orderRepo = dataSource.getRepository(Order);
  const orderHistoryRepo = dataSource.getRepository(OrderStatusHistory);
  const paymentRepo = dataSource.getRepository(Payment);
  const riderRepo = dataSource.getRepository(Rider);
  const assignmentRepo = dataSource.getRepository(DeliveryAssignment);

  let owner = await userRepo.findOne({ where: { email: 'owner@foodexpress.test' } });
  if (!owner) {
    owner = await userRepo.save(
      userRepo.create({
        name: 'Demo Restaurant Owner',
        email: 'owner@foodexpress.test',
        passwordHash: await bcrypt.hash('password123', 10),
        role: UserRole.RESTAURANT_OWNER,
      }),
    );
    console.log('Created owner account: owner@foodexpress.test / password123');
  }

  // Public registration can no longer create admin accounts (see
  // register.dto.ts) — this is now the only way to get one for local dev.
  const admin = await userRepo.findOne({ where: { email: 'admin@foodexpress.test' } });
  if (!admin) {
    await userRepo.save(
      userRepo.create({
        name: 'Demo Admin',
        email: 'admin@foodexpress.test',
        passwordHash: await bcrypt.hash('password123', 10),
        role: UserRole.ADMIN,
      }),
    );
    console.log('Created admin account: admin@foodexpress.test / password123');
  }

  for (const r of sampleRestaurants) {
    let restaurant = await restaurantRepo.findOne({ where: { name: r.name } });
    if (restaurant) {
      console.log(`Skipping "${r.name}" — already exists`);
      continue;
    }

    restaurant = await restaurantRepo.save(
      restaurantRepo.create({
        ownerId: owner.id,
        name: r.name,
        description: r.description,
        cityId: CITY_ID,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        isOpen: true,
        avgPrepTimeMinutes: 20,
      }),
    );

    for (const item of r.items) {
      await menuRepo.save(
        menuRepo.create({ ...item, restaurantId: restaurant.id, isAvailable: true }),
      );
    }
    console.log(`Created "${restaurant.name}" with ${r.items.length} menu items`);
  }

  let customer = await userRepo.findOne({ where: { email: 'customer@foodexpress.test' } });
  if (!customer) {
    customer = await userRepo.save(
      userRepo.create({
        name: 'Demo Customer',
        email: 'customer@foodexpress.test',
        passwordHash: await bcrypt.hash('password123', 10),
        role: UserRole.CUSTOMER,
      }),
    );
    console.log('Created customer account: customer@foodexpress.test / password123');
  }

  let riderUser = await userRepo.findOne({ where: { email: 'rider@foodexpress.test' } });
  if (!riderUser) {
    riderUser = await userRepo.save(
      userRepo.create({
        name: 'Demo Rider',
        email: 'rider@foodexpress.test',
        passwordHash: await bcrypt.hash('password123', 10),
        role: UserRole.RIDER,
      }),
    );
    console.log('Created rider account: rider@foodexpress.test / password123');
  }

  let rider = await riderRepo.findOne({ where: { userId: riderUser.id } });
  if (!rider) {
    rider = await riderRepo.save(
      riderRepo.create({
        userId: riderUser.id,
        vehicleType: 'Bike',
        isActive: true,
        currentLat: 12.9719,
        currentLng: 77.6412,
      }),
    );
    console.log('Created demo rider profile');
  }

  let order = await orderRepo.findOne({ where: { customerId: customer.id } });
  if (!order) {
    const restaurants = await restaurantRepo.find();
    const firstRestaurant = restaurants[0];
    const menuItems = await menuRepo.find({ where: { restaurantId: firstRestaurant.id } });

    order = await orderRepo.save(
      orderRepo.create({
        customerId: customer.id,
        restaurantId: firstRestaurant.id,
        status: OrderStatus.PLACED,
        subtotal: 180,
        deliveryFee: 30,
        total: 210,
        deliveryAddress: 'MG Road, Bengaluru',
        deliveryLat: 12.9716,
        deliveryLng: 77.5946,
        items: [
          {
            menuItemId: menuItems[0].id,
            quantity: 2,
            unitPrice: menuItems[0].price,
          },
        ],
      } as Partial<Order>),
    );

    await orderHistoryRepo.save(
      orderHistoryRepo.create({
        orderId: order.id,
        status: OrderStatus.PLACED,
      }),
    );
    console.log('Created sample order for customer');
  }

  let payment = await paymentRepo.findOne({ where: { orderId: order.id } });
  if (!payment) {
    payment = await paymentRepo.save(
      paymentRepo.create({
        orderId: order.id,
        amount: order.total,
        currency: 'INR',
        provider: 'stub',
        status: PaymentStatus.SUCCEEDED,
        idempotencyKey: `seed-${order.id}`,
      }),
    );
    console.log('Created sample payment for the order');
  }

  let assignment = await assignmentRepo.findOne({ where: { orderId: order.id } });
  if (!assignment) {
    assignment = await assignmentRepo.save(
      assignmentRepo.create({
        orderId: order.id,
        riderId: rider.id,
      }),
    );
    console.log('Created sample delivery assignment');
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});