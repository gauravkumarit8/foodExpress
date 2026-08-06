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
  entities: [User, Restaurant, MenuItem],
  synchronize: false,
});

const CITY_ID = '00000000-0000-0000-0000-000000000001'; // placeholder single-city id

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

  await dataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});