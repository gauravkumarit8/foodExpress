import type {
  AssignDeliveryRequest,
  AuthMe,
  AuthResponse,
  BrowseRestaurantsParams,
  CreateMenuItemRequest,
  CreateOrderRequest,
  CreateRatingRequest,
  CreateRestaurantRequest,
  CreateRiderRequest,
  DeliveryAssignment,
  LoginRequest,
  MenuItem,
  Order,
  OrderStatus,
  PaginatedResult,
  PaginationParams,
  RegisterRequest,
  Restaurant,
  Rider,
  Rating,
  UpdateMenuItemRequest,
  UpdateRestaurantRequest,
  User,
} from './types';

/**
 * Storage is pluggable so the same client works with localStorage on web
 * and SecureStore/AsyncStorage on React Native without this file caring
 * which one it's talking to.
 */
export interface TokenStorage {
  getToken(): Promise<string | null> | string | null;
  setToken(token: string): Promise<void> | void;
  clearToken(): Promise<void> | void;
}

/** In-memory fallback — fine for quick testing, loses the session on reload. */
export class MemoryTokenStorage implements TokenStorage {
  private token: string | null = null;
  getToken() {
    return this.token;
  }
  setToken(token: string) {
    this.token = token;
  }
  clearToken() {
    this.token = null;
  }
}

export class ApiError extends Error {
  readonly status: number;
  /** Raw `message` field from Nest's error body — string or validation-error array. */
  readonly details: string | string[];

  constructor(status: number, details: string | string[]) {
    super(Array.isArray(details) ? details.join(', ') : details);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface ApiClientOptions {
  /** e.g. "http://localhost:3000/api/v1" */
  baseUrl: string;
  storage: TokenStorage;
  /** Called when a request comes back 401 — a good place to force a logout/redirect. */
  onUnauthorized?: () => void;
}

function toQueryString(params: object | undefined): string {
  if (!params) return '';
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return '';
  const search = new URLSearchParams();
  for (const [key, value] of entries) search.set(key, String(value));
  return `?${search.toString()}`;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly storage: TokenStorage;
  private readonly onUnauthorized?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.storage = options.storage;
    this.onUnauthorized = options.onUnauthorized;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: object,
  ): Promise<T> {
    const token = await this.storage.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.baseUrl}${path}${toQueryString(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.onUnauthorized?.();
    }

    if (!res.ok) {
      let details: string | string[] = res.statusText;
      try {
        const parsed = await res.json();
        if (parsed?.message) details = parsed.message;
      } catch {
        // body wasn't JSON — fall back to statusText
      }
      throw new ApiError(res.status, details);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  // ---- auth -----------------------------------------------------------

  auth = {
    register: (dto: RegisterRequest) => this.request<AuthResponse>('POST', '/auth/register', dto),
    login: (dto: LoginRequest) => this.request<AuthResponse>('POST', '/auth/login', dto),
    /** Decoded JWT claims only ({userId, email, role}) — use users.getProfile() for the full record. */
    me: () => this.request<AuthMe>('GET', '/auth/me'),
    setToken: async (token: string) => {
      await this.storage.setToken(token);
    },
    logout: async () => {
      await this.storage.clearToken();
    },
  };

  // ---- users ------------------------------------------------------------

  users = {
    /** Only your own id is allowed by the backend — pass the userId from auth.me(). */
    getProfile: (id: string) => this.request<User>('GET', `/users/${id}`),
  };

  // ---- restaurants --------------------------------------------------

  restaurants = {
    browse: (params?: BrowseRestaurantsParams) =>
      this.request<PaginatedResult<Restaurant>>('GET', '/restaurants', undefined, params),
    /** Restaurants owned by the current user (restaurant_owner role). */
    mine: () => this.request<Restaurant[]>('GET', '/restaurants/mine'),
    get: (id: string) => this.request<Restaurant>('GET', `/restaurants/${id}`),
    getMenu: (id: string) => this.request<MenuItem[]>('GET', `/restaurants/${id}/menu`),
    create: (dto: CreateRestaurantRequest) => this.request<Restaurant>('POST', '/restaurants', dto),
    update: (id: string, dto: UpdateRestaurantRequest) =>
      this.request<Restaurant>('PATCH', `/restaurants/${id}`, dto),
    createMenuItem: (restaurantId: string, dto: CreateMenuItemRequest) =>
      this.request<MenuItem>('POST', `/restaurants/${restaurantId}/menu-items`, dto),
    updateMenuItem: (restaurantId: string, itemId: string, dto: UpdateMenuItemRequest) =>
      this.request<MenuItem>('PATCH', `/restaurants/${restaurantId}/menu-items/${itemId}`, dto),
  };

  // ---- orders ---------------------------------------------------------

  orders = {
    create: (dto: CreateOrderRequest) => this.request<Order>('POST', '/orders', dto),
    get: (id: string) => this.request<Order>('GET', `/orders/${id}`),
    /** The current customer's own order history. */
    mine: (params?: PaginationParams) =>
      this.request<PaginatedResult<Order>>('GET', '/users/me/orders', undefined, params),
    /** Incoming orders for a restaurant you own. */
    forRestaurant: (restaurantId: string, params?: PaginationParams) =>
      this.request<PaginatedResult<Order>>(
        'GET',
        `/restaurants/${restaurantId}/orders`,
        undefined,
        params,
      ),
    /** accepted | preparing | ready | cancelled — picked_up/delivered are set via delivery.* instead. */
    updateStatus: (id: string, status: OrderStatus) =>
      this.request<Order>('PATCH', `/orders/${id}/status`, { status }),
    rate: (id: string, dto: CreateRatingRequest) => this.request<Rating>('POST', `/orders/${id}/rating`, dto),
  };

  // ---- delivery ---------------------------------------------------------

  delivery = {
    registerAsRider: (dto: CreateRiderRequest) => this.request<Rider>('POST', '/delivery/riders', dto),
    setMyAvailability: (isActive: boolean) =>
      this.request<Rider>('PATCH', '/delivery/riders/me/status', { isActive }),
    /** Admin only. */
    availableRiders: () => this.request<Rider[]>('GET', '/delivery/riders/available'),
    /** The current rider's assignments. */
    myAssignments: () => this.request<DeliveryAssignment[]>('GET', '/delivery/mine'),
    /** Admin only — orders are dispatched to riders manually in this MVP. */
    assign: (dto: AssignDeliveryRequest) => this.request<DeliveryAssignment>('POST', '/delivery/assign', dto),
    markPickedUp: (orderId: string) =>
      this.request<DeliveryAssignment>('PATCH', `/delivery/${orderId}/picked-up`),
    markDelivered: (orderId: string) =>
      this.request<DeliveryAssignment>('PATCH', `/delivery/${orderId}/delivered`),
  };
}
