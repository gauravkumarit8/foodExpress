import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, OrderStatus, type Order } from '@foodexpress/api-client';
import { api } from '../lib/api';
import { OrderTicketRail } from '../components/OrderTicketRail';

const POLL_INTERVAL_MS = 6000;
const TERMINAL_STATUSES = new Set<OrderStatus>([OrderStatus.DELIVERED, OrderStatus.CANCELLED]);

function RatingForm({ orderId }: { orderId: string }) {
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'already-rated'>('idle');

  async function submit() {
    setStatus('submitting');
    try {
      await api.orders.rate(orderId, { restaurantRating, comment: comment || undefined });
      setStatus('done');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStatus('already-rated');
      } else {
        setStatus('idle');
      }
    }
  }

  if (status === 'done') return <p className="mt-4 text-sm text-pass-500">Thanks for rating your order!</p>;
  if (status === 'already-rated') return <p className="mt-4 text-sm text-ink/50">You've already rated this order.</p>;

  return (
    <div className="mt-4 rounded-ticket border border-line bg-white p-4">
      <p className="font-medium text-ink">Rate this order</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRestaurantRating(n)}
            className={`h-9 w-9 rounded-ticket border font-mono ${
              n <= restaurantRating ? 'border-cook-500 bg-cook-100 text-cook-700' : 'border-line text-ink/30'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Any feedback? (optional)"
        rows={2}
        className="mt-3 w-full rounded-ticket border border-line px-3 py-2 text-sm focus:border-ticket-500"
      />
      <button
        onClick={submit}
        disabled={status === 'submitting'}
        className="mt-3 rounded-ticket bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ticket-500 disabled:opacity-60"
      >
        Submit rating
      </button>
    </div>
  );
}

export function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    function fetchOrder() {
      api.orders
        .get(id!)
        .then((o) => {
          setOrder(o);
          if (TERMINAL_STATUSES.has(o.status) && timerRef.current) {
            clearInterval(timerRef.current);
          }
        })
        .catch(() => setError('Could not load this order.'));
    }

    fetchOrder();
    timerRef.current = setInterval(fetchOrder, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-12 text-center text-ticket-500">{error}</p>;
  if (!order) return <p className="mx-auto max-w-3xl px-4 py-12 text-center text-ink/50">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">Track your order</h1>

      <OrderTicketRail order={order} />

      <div className="mt-4 rounded-ticket border border-line bg-white p-4">
        <p className="mb-2 text-sm font-medium text-ink">Items</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span className="text-ink/80">
              {item.quantity}× {item.menuItemName ?? 'Item'}
            </span>
            <span className="font-mono text-ink/60">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-line pt-2 font-medium text-ink">
          <span>Total</span>
          <span className="font-mono font-bold">₹{order.total.toFixed(2)}</span>
        </div>
        <p className="mt-2 text-sm text-ink/60">Delivering to: {order.deliveryAddress}</p>
        {order.deliveryInstructions && (
          <p className="text-sm text-ink/50">Note: {order.deliveryInstructions}</p>
        )}
      </div>

      {order.status === OrderStatus.DELIVERED && <RatingForm orderId={order.id} />}
    </div>
  );
}
