import { useEffect, useState } from 'react';
import {
  ApiError,
  ORDER_STATUS_LABEL,
  RESTAURANT_STATUS_ACTIONS,
  OrderStatus,
  type Order,
} from '@foodexpress/api-client';
import { api } from '../../lib/api';

const STATUS_COLOR: Record<OrderStatus, string> = {
  [OrderStatus.PLACED]: 'bg-paper-dark text-ink/70',
  [OrderStatus.ACCEPTED]: 'bg-route-100 text-route-700',
  [OrderStatus.PREPARING]: 'bg-cook-100 text-cook-700',
  [OrderStatus.READY]: 'bg-cook-100 text-cook-700',
  [OrderStatus.PICKED_UP]: 'bg-route-100 text-route-700',
  [OrderStatus.DELIVERED]: 'bg-pass-100 text-pass-700',
  [OrderStatus.CANCELLED]: 'bg-ticket-50 text-ticket-700',
};

function OrderCard({ order, onUpdated }: { order: Order; onUpdated: (o: Order) => void }) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const actions = RESTAURANT_STATUS_ACTIONS[order.status] ?? [];

  async function applyStatus(status: OrderStatus) {
    setUpdating(true);
    setError(null);
    try {
      onUpdated(await api.orders.updateStatus(order.id, status));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this order.');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-ticket border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink/40">
            Order #{order.id.slice(0, 8)}
          </p>
          <p className="mt-0.5 font-mono text-xs text-ink/40">{new Date(order.placedAt).toLocaleString()}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        {order.items.map((item) => (
          <p key={item.id} className="text-sm text-ink/80">
            {item.quantity}× {item.menuItemName ?? 'Item'}
            {item.notes && <span className="text-ink/50"> — {item.notes}</span>}
          </p>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink/60">Deliver to: {order.deliveryAddress}</p>
      {order.deliveryInstructions && (
        <p className="text-sm text-ink/50">Note: {order.deliveryInstructions}</p>
      )}
      <p className="mt-1 font-mono text-sm font-medium text-ink">Total: ₹{order.total.toFixed(2)}</p>

      {error && <p className="mt-2 text-xs text-ticket-500">{error}</p>}

      {actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              onClick={() => applyStatus(action.status)}
              disabled={updating}
              className={`rounded-ticket px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
                action.status === OrderStatus.CANCELLED
                  ? 'border border-ticket-500 text-ticket-500 hover:bg-ticket-50'
                  : 'bg-ink text-paper hover:bg-ticket-500'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {order.status === OrderStatus.READY && (
        <p className="mt-3 text-xs text-ink/40">Waiting for a rider to pick this order up.</p>
      )}
    </div>
  );
}

export function OwnerOrdersPanel({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.orders
      .forRestaurant(restaurantId, { page, limit: 20 })
      .then((result) => {
        setOrders((prev) => (page === 1 ? result.data : [...prev, ...result.data]));
        setTotalPages(result.totalPages);
      })
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false));
  }, [restaurantId, page]);

  function handleUpdated(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  if (loading && page === 1) return <p className="py-8 text-center text-ink/50">Loading orders…</p>;
  if (error) return <p className="text-sm text-ticket-500">{error}</p>;
  if (orders.length === 0) return <p className="py-8 text-center text-ink/50">No orders yet.</p>;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onUpdated={handleUpdated} />
      ))}
      {page < totalPages && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="w-full rounded-ticket border border-line py-2.5 text-sm font-medium text-ink hover:border-ticket-500 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
