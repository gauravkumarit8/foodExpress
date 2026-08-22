import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole, type MenuItem, type Restaurant } from '@foodexpress/api-client';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { MenuItemRow } from '../components/MenuItemRow';
import { RestaurantThumb } from '../components/RestaurantThumb';

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 animate-pulse rounded-ticket bg-paper-dark" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-6 w-1/2 animate-pulse rounded bg-paper-dark" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-paper-dark" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-paper-dark" />
        </div>
      </div>
      <div className="h-40 animate-pulse rounded-ticket bg-paper-dark" />
    </div>
  );
}

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const cart = useCart();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guests and customers can order; a logged-in owner/rider browsing here is
  // just viewing — the cart/checkout routes redirect them away anyway, so
  // hiding the ordering affordances here avoids a dead-end click.
  const canOrder = !user || user.role === UserRole.CUSTOMER;

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

  if (loading) return <DetailSkeleton />;
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

  function handleDecrement(item: MenuItem) {
    const current = cart.lines.find((l) => l.menuItem.id === item.id)?.quantity ?? 0;
    cart.updateQuantity(item.id, current - 1);
  }

  const categories = Array.from(new Set(menu.map((m) => m.category || 'Menu')));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-3xl px-4 py-6 pb-24"
    >
      <div className="mb-6 flex items-start gap-4">
        <RestaurantThumb src={restaurant.imageUrl} alt={restaurant.name} size={80} />
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
          {!canOrder && (
            <p className="mt-2 inline-block rounded-ticket bg-route-100 px-2 py-0.5 text-xs font-medium text-route-700">
              Viewing as {user?.role === UserRole.RESTAURANT_OWNER ? 'restaurant owner' : 'rider'} — ordering is for customer accounts
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
                  onAdd={canOrder ? () => handleAdd(item) : undefined}
                  onDecrement={canOrder ? () => handleDecrement(item) : undefined}
                />
              ))}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {canOrder && cart.itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
          >
            <Link
              to="/cart"
              className="flex items-center justify-between rounded-ticket bg-ink px-5 py-3 text-paper shadow-lg transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="font-medium">
                {cart.itemCount} item{cart.itemCount > 1 ? 's' : ''} in cart
              </span>
              <span className="font-mono font-bold">₹{cart.subtotal.toFixed(2)}</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
