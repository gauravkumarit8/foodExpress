import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '@foodexpress/api-client';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { getCurrentPosition } from '../lib/geolocation';

const DELIVERY_FEE = 30; // matches the backend's flat placeholder fee — shown so the total isn't a surprise

export function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPosition().then((c) => {
      setCoords(c);
      setLocating(false);
    });
  }, []);

  if (cart.lines.length === 0 || !cart.restaurantId) {
    return <Navigate to="/cart" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!coords) {
      setError('We need your delivery location — enable location access and try again.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.orders.create({
        restaurantId: cart.restaurantId!,
        items: cart.lines.map((l) => ({
          menuItemId: l.menuItem.id,
          quantity: l.quantity,
          notes: l.notes || undefined,
        })),
        deliveryAddress: address,
        deliveryLat: coords.lat,
        deliveryLng: coords.lng,
        deliveryInstructions: instructions || undefined,
      });
      cart.clear();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not place your order. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-ink">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Delivery address</label>
          <textarea
            required
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Flat / house no., street, area"
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
          <p className="mt-1 text-xs text-ink/40">
            {locating
              ? 'Getting your location…'
              : coords
                ? 'Using your current location for delivery routing.'
                : 'Location unavailable — enable it in your browser to place an order.'}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Delivery instructions (optional)</label>
          <input
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Leave at the door"
            maxLength={300}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>

        <div className="rounded-ticket border border-line bg-white px-4 py-3">
          <div className="flex justify-between text-sm text-ink/70">
            <span>Subtotal</span>
            <span className="font-mono">₹{cart.subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-ink/70">
            <span>Delivery fee</span>
            <span className="font-mono">₹{DELIVERY_FEE.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 font-medium text-ink">
            <span>Total</span>
            <span className="font-mono font-bold">₹{(cart.subtotal + DELIVERY_FEE).toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-ticket-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || locating}
          className="w-full rounded-ticket bg-ink py-3 font-medium text-paper hover:bg-ticket-500 disabled:opacity-60"
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
