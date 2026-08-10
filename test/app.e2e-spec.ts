import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

/**
 * Walks the entire core user journey through real HTTP calls against a real
 * database: register -> create restaurant -> add menu item -> place order ->
 * walk the status state machine -> rate it -> register as a rider.
 * This is the automated version of everything that's been curl-tested by
 * hand throughout development.
 */
describe('FoodExpress API (e2e)', () => {
  let app: INestApplication;

  // Unique per run so re-running locally against the same dev DB doesn't
  // collide on the unique email constraint.
  const suffix = Date.now();
  const customerEmail = `e2e-customer-${suffix}@example.com`;
  const ownerEmail = `e2e-owner-${suffix}@example.com`;

  let customerToken: string;
  let ownerToken: string;
  let restaurantId: string;
  let menuItemId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // same function main.ts uses — no more drift between test and prod config
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health is up', () => {
    return request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('registers a customer and a restaurant owner', async () => {
    const customerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'E2E Customer', email: customerEmail, password: 'password123' })
      .expect(201);
    customerToken = customerRes.body.accessToken;
    expect(customerToken).toBeDefined();

    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'E2E Owner',
        email: ownerEmail,
        password: 'password123',
        role: 'restaurant_owner',
      })
      .expect(201);
    ownerToken = ownerRes.body.accessToken;
  });

  it('rejects duplicate email registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'E2E Customer', email: customerEmail, password: 'password123' })
      .expect(409);
  });

  it('rejects wrong password on login', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: customerEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('never returns the password hash from GET /users/:id', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/users/${me.body.userId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.email).toBeDefined(); // sanity check: this isn't just an empty response
  });

  it('rejects one user viewing another user\'s profile entirely', async () => {
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/users/${me.body.userId}`)
      .set('Authorization', `Bearer ${ownerToken}`) // a different account
      .expect(403);
  });

  it('creates a restaurant owned by the owner account', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/restaurants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `E2E Kitchen ${suffix}`,
        cityId: '00000000-0000-4000-8000-000000000001',
        latitude: 12.9716,
        longitude: 77.5946,
      })
      .expect(201);
    restaurantId = res.body.id;
    expect(restaurantId).toBeDefined();
  });

  it('sets the owner from the JWT, not from the request body', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantId}`)
      .expect(200);
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(res.body.ownerId).toBe(me.body.userId);
  });

  it('adds a menu item to the restaurant', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/restaurants/${restaurantId}/menu-items`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'E2E Test Dish', price: 100, category: 'Test' })
      .expect(201);
    menuItemId = res.body.id;
  });

  it('finds the restaurant via GET /restaurants/mine (the actual fix — and proves "mine" is not swallowed by the :id route)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/restaurants/mine')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(res.body.some((r: any) => r.id === restaurantId)).toBe(true);
  });

  it('returns an empty list for GET /restaurants/mine when the caller owns nothing', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/restaurants/mine')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it('lets the owner update and close the restaurant, and rejects a non-owner doing the same', async () => {
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isOpen: false })
      .expect(200);
    expect(updated.body.isOpen).toBe(false);

    await request(app.getHttpServer())
      .patch(`/api/v1/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ isOpen: true })
      .expect(403);

    // reopen it — later tests need to place an order against this restaurant
    await request(app.getHttpServer())
      .patch(`/api/v1/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isOpen: true })
      .expect(200);
  });

  it('rejects a different account editing this restaurant (ownership check)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/restaurants/${restaurantId}/menu-items`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Sneaky Item', price: 1 })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/api/v1/restaurants/${restaurantId}/menu-items/${menuItemId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ price: 1 })
      .expect(403);
  });

  it('lists the restaurant in the public restaurants feed', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/restaurants').expect(200);
    expect(res.body.some((r: any) => r.id === restaurantId)).toBe(true);
  });

  it('rejects a client-supplied price on the order (the actual vulnerability this fixes)', async () => {
    // unitPrice isn't a field on the DTO anymore — forbidNonWhitelisted
    // rejects the whole request rather than silently ignoring the attempt.
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ menuItemId, quantity: 1, unitPrice: 1 }],
        deliveryAddress: 'Test',
        deliveryLat: 12.9,
        deliveryLng: 77.6,
      })
      .expect(400);
  });

  it('places an order as the customer, priced from the real menu item', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        restaurantId,
        items: [{ menuItemId, quantity: 2 }],
        deliveryAddress: '221B Test Street, Bengaluru',
        deliveryLat: 12.9352,
        deliveryLng: 77.6245,
      })
      .expect(201);
    orderId = res.body.id;
    expect(res.body.status).toBe('placed');
    expect(Number(res.body.subtotal)).toBe(200); // 100 (real menu price) * 2, not attacker-controlled
  });

  it('lets the restaurant see its own incoming orders (the actual fix — there was no way to do this before)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantId}/orders`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(res.body.some((o: any) => o.id === orderId)).toBe(true);
  });

  it('rejects a non-owner viewing the restaurant\'s order list', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/restaurants/${restaurantId}/orders`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('rejects rating an order before it is delivered', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/rating`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ restaurantRating: 5 })
      .expect(400);
  });

  it('advances the order to ready via the restaurant workflow', async () => {
    for (const status of ['accepted', 'preparing', 'ready']) {
      await request(app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status })
        .expect(200);
    }
  });

  it('rejects the customer trying to advance the order themselves', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'accepted' }) // irrelevant which status — customer can't drive this at all
      .expect(403);
  });

  it('rejects a stranger viewing this order entirely', async () => {
    const strangerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Stranger',
        email: `e2e-stranger-${suffix}@example.com`,
        password: 'password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${strangerRes.body.accessToken}`)
      .expect(403);
  });

  it('rejects setting picked_up directly on the general status endpoint', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'picked_up' })
      .expect(400);
  });

  let riderToken: string;

  it('registers a rider and assigns them to the now-ready order', async () => {
    const riderEmail = `e2e-rider-${suffix}@example.com`;
    const riderRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'E2E Rider', email: riderEmail, password: 'password123', role: 'rider' })
      .expect(201);
    riderToken = riderRes.body.accessToken;

    const riderProfile = await request(app.getHttpServer())
      .post('/api/v1/delivery/riders')
      .set('Authorization', `Bearer ${riderToken}`)
      .send({ vehicleType: 'bike' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/delivery/assign')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId, riderId: riderProfile.body.id })
      .expect(201);
  });

  it('rejects assigning a rider ID that does not exist (the actual fix from this round)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/delivery/assign')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId, riderId: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
  });

  it('rejects a duplicate assignment for the same order, even with a second real rider', async () => {
    const secondRiderEmail = `e2e-rider-2-${suffix}@example.com`;
    const secondRiderRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'E2E Second Rider',
        email: secondRiderEmail,
        password: 'password123',
        role: 'rider',
      })
      .expect(201);
    const secondRiderToken = secondRiderRes.body.accessToken;
    const secondRiderProfile = await request(app.getHttpServer())
      .post('/api/v1/delivery/riders')
      .set('Authorization', `Bearer ${secondRiderToken}`)
      .send({ vehicleType: 'bike' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/delivery/assign')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ orderId, riderId: secondRiderProfile.body.id }) // a real, active, different rider
      .expect(409); // still rejected — the order already has a rider, real or not
  });

  it('lets the rider see their own assignment via GET /delivery/mine (the actual fix)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/delivery/mine')
      .set('Authorization', `Bearer ${riderToken}`)
      .expect(200);
    expect(res.body.some((a: any) => a.orderId === orderId)).toBe(true);
  });

  it('picking up via the delivery endpoint advances the order status too', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/delivery/${orderId}/picked-up`)
      .set('Authorization', `Bearer ${riderToken}`)
      .expect(200);

    const order = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(order.body.status).toBe('picked_up');
  });

  it('delivering via the delivery endpoint advances the order status to delivered', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/delivery/${orderId}/delivered`)
      .set('Authorization', `Bearer ${riderToken}`)
      .expect(200);

    const order = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(order.body.status).toBe('delivered');
  });

  it('rejects an illegal transition once the order is delivered', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'accepted' })
      .expect(400);
  });

  it('rates the delivered order', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/rating`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ restaurantRating: 5, riderRating: 4, comment: 'e2e test run' })
      .expect(201);
  });

  it('rejects rating the same order twice', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/rating`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ restaurantRating: 3 })
      .expect(409);
  });

  it('registers the customer as a rider, appears in available riders, then goes offline', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/delivery/riders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ vehicleType: 'bike' })
      .expect(201);

    const available = await request(app.getHttpServer())
      .get('/api/v1/delivery/riders/available')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(available.body.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .patch('/api/v1/delivery/riders/me/status')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ isActive: false })
      .expect(200);
  });
});
