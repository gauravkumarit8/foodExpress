// Mirrors the FoodExpress NestJS backend exactly (entities, DTOs, enums).
// Keep this in sync with the backend if routes or shapes change.

export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT_OWNER = 'restaurant_owner',
  RIDER = 'rider',
  ADMIN = 'admin',
}

// Subset of UserRole that is legal to self-register as — ADMIN is excluded
// server-side, so we exclude it here too rather than let the UI offer it.
export type SelfRegisterableRole =
  | UserRole.CUSTOMER
  | UserRole.RESTAURANT_OWNER
  | UserRole.RIDER;

export enum OrderStatus {
  PLACED = 'placed',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// The order in which a normal (non-cancelled) order progresses. Drives the
// "ticket rail" tracking UI on both web and mobile.
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  OrderStatus.PLACED,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: 'Order placed',
  [OrderStatus.ACCEPTED]: 'Accepted by kitchen',
  [OrderStatus.PREPARING]: 'Preparing',
  [OrderStatus.READY]: 'Ready for pickup',
  [OrderStatus.PICKED_UP]: 'Out for delivery',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
};

/**
 * Actions a restaurant owner (or admin) can take via PATCH /orders/:id/status,
 * keyed by the order's current status. Mirrors the backend's
 * ALLOWED_TRANSITIONS ∩ PUBLICLY_SETTABLE_STATUSES exactly — picked_up and
 * delivered are deliberately absent since those only happen through the
 * delivery module (rider actions), never this endpoint.
 */
export const RESTAURANT_STATUS_ACTIONS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }[]>> = {
  [OrderStatus.PLACED]: [
    { status: OrderStatus.ACCEPTED, label: 'Accept order' },
    { status: OrderStatus.CANCELLED, label: 'Cancel' },
  ],
  [OrderStatus.ACCEPTED]: [
    { status: OrderStatus.PREPARING, label: 'Start preparing' },
    { status: OrderStatus.CANCELLED, label: 'Cancel' },
  ],
  [OrderStatus.PREPARING]: [
    { status: OrderStatus.READY, label: 'Mark ready for pickup' },
    { status: OrderStatus.CANCELLED, label: 'Cancel' },
  ],
  [OrderStatus.READY]: [{ status: OrderStatus.CANCELLED, label: 'Cancel' }],
};

/** Decoded JWT payload — this is exactly what GET /auth/me returns. */
export interface AuthMe {
  userId: string;
  email: string;
  role: UserRole;
}

/** Full profile — GET /users/:id (only your own id is allowed). */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  cityId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  cityId: string;
  address?: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  avgPrepTimeMinutes: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryInstructions?: string;
  /**
   * Only populated by orders.get(id) and orders.updateStatus() — the
   * backend's list endpoints (orders.mine, orders.forRestaurant) don't
   * eager-load line items for performance, so this is undefined there.
   * Always guard with `order.items ?? []` rather than assuming it's set.
   */
  items?: OrderItem[];
  placedAt: string;
  updatedAt: string;
}

export interface Rating {
  id: string;
  orderId: string;
  customerId: string;
  restaurantRating: number;
  riderRating?: number;
  comment?: string;
}

export interface Rider {
  id: string;
  userId: string;
  vehicleType?: string;
  isActive: boolean;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  riderId: string;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

// ---- Request bodies -------------------------------------------------

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: SelfRegisterableRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface BrowseRestaurantsParams extends PaginationParams {
  lat?: number;
  lng?: number;
  /** 1-50, defaults to 5 server-side. Only applied when lat+lng are set. */
  radiusKm?: number;
}

export interface CreateRestaurantRequest {
  name: string;
  description?: string;
  cityId: string;
  address?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

export interface UpdateRestaurantRequest {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  avgPrepTimeMinutes?: number;
  imageUrl?: string;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  category?: string;
  price: number;
  imageUrl?: string;
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderRequest {
  restaurantId: string;
  items: CreateOrderItemRequest[];
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryInstructions?: string;
}

export interface CreateRatingRequest {
  restaurantRating: number;
  riderRating?: number;
  comment?: string;
}

export interface CreateRiderRequest {
  vehicleType?: string;
}

export interface AssignDeliveryRequest {
  orderId: string;
  riderId: string;
}
