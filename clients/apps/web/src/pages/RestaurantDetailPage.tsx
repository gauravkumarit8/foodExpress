import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { MenuItem, Restaurant } from '@foodexpress/api-client';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { MenuItemRow } from '../components/MenuItemRow';

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cart = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.restaurants.get(id), api.restaurants.getMenu(id)])
      .then(([r, m]) => {
        setRestaurant(r);
        setMenu(m);
      })
      .catch(() => setError('Could not load this restaurant.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-12 text-center text-ink/50">Loading…</p>;
  if (error || !restaurant)
    return <p className="mx-auto max-w-3xl px-4 py-12 text-center text-ticket-500">{error ?? 'Not found.'}</p>;

  function handleAdd(item: MenuItem) {
    if (!restaurant) return;
    if (!cart.canAddFrom(restaurant.id)) {
      const confirmed = window.confirm(
        `Your cart has items from ${cart.restaurantName}. Start a new cart for ${restaurant.name}?`,
      );
      if (!confirmed) return;
    }
    cart.addItem(restaurant, item);
  }

  const categories = Array.from(new Set(menu.map((m) => m.category || 'Menu')));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-ticket bg-paper-dark">
          {restaurant.imageUrl && (
            <img src={restaurant.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{restaurant.name}</h1>
          {restaurant.description && <p className="mt-1 text-sm text-ink/60">{restaurant.description}</p>}
          <p className="mt-1 font-mono text-xs text-ink/50">
            ~{restaurant.avgPrepTimeMinutes} min · {restaurant.address}
          </p>
          {!restaurant.isOpen && (
            <p className="mt-2 inline-block rounded-ticket bg-ticket-50 px-2 py-0.5 text-xs font-medium text-ticket-700">
              Currently closed — ordering unavailable
            </p>
          )}
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-widest text-ink/50">
            {category}
          </h2>
          <div className="rounded-ticket border border-line bg-white px-4">
            {menu
              .filter((m) => (m.category || 'Menu') === category)
              .map((item) => (
                <MenuItemRow
                  key={item.id}
                  item={item}
                  quantityInCart={cart.lines.find((l) => l.menuItem.id === item.id)?.quantity ?? 0}
                  onAdd={() => handleAdd(item)}
                />
              ))}
          </div>
        </div>
      ))}

      {cart.itemCount > 0 && (
        <Link
          to="/cart"
          className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-ticket bg-ink px-5 py-3 text-paper shadow-lg"
        >
          <span className="font-medium">
            {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} in cart
          </span>
          <span className="font-mono font-bold">₹{cart.subtotal.toFixed(2)}</span>
        </Link>
      )}
    </div>
  );
}
