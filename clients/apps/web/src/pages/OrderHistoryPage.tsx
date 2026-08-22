import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABEL, OrderStatus, type Order } from '@foodexpress/api-client';
import { api } from '../lib/api';

const STATUS_COLOR: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: 'bg-paper-dark text-ink/70',
  [OrderStatus.ACCEPTED]: 'bg-route-100 text-route-700',
  [OrderStatus.PREPARING]: 'bg-cook-100 text-cook-700',
  [OrderStatus.READY]: 'bg-cook-100 text-cook-700',
  [OrderStatus.PICKED_UP]: 'bg-route-100 text-route-700',
  [OrderStatus.DELIVERED]: 'bg-pass-100 text-pass-700',
  [OrderStatus.CANCELLED]: 'bg-ticket-50 text-ticket-700',
};

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.orders
      .mine({ page: 1, limit: 50 })
      .then(async (result) => {
        setOrders(result.data);
        const uniqueIds = Array.from(new Set(result.data.map((o) => o.restaurantId)));
        const entries = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const r = await api.restaurants.get(id);
              return [id, r.name] as const;
            } catch {
              return [id, 'Restaurant'] as const;
            }
          }),
        );
        setRestaurantNames(Object.fromEntries(entries));
      })
      .catch(() => setError('Could not load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">Your orders</h1>

      {error && <p className="text-sm text-ticket-500">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-ink/50">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="py-12 text-center text-ink/50">No orders yet — your history will show up here.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-ticket border border-line bg-white p-4 hover:border-ticket-500"
            >
              <div>
                <p className="font-medium text-ink">{restaurantNames[order.restaurantId] ?? '…'}</p>
                <p className="mt-0.5 font-mono text-xs text-ink/40">
                  {new Date(order.placedAt).toLocaleDateString()} · ₹{order.total.toFixed(2)}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
