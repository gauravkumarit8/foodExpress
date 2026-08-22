import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError, type MenuItem, type Restaurant } from '@foodexpress/api-client';
import { api } from '../../lib/api';
import { MenuEditor } from '../../components/owner/MenuEditor';
import { OwnerOrdersPanel } from '../../components/owner/OwnerOrdersPanel';

type Tab = 'menu' | 'orders';

export function RestaurantDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tab, setTab] = useState<Tab>('orders');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingOpen, setTogglingOpen] = useState(false);

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

  async function toggleOpen() {
    if (!restaurant) return;
    setTogglingOpen(true);
    try {
      const updated = await api.restaurants.update(restaurant.id, { isOpen: !restaurant.isOpen });
      setRestaurant(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setTogglingOpen(false);
    }
  }

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-12 text-center text-ink/50">Loading…</p>;
  if (error && !restaurant)
    return <p className="mx-auto max-w-3xl px-4 py-12 text-center text-ticket-500">{error}</p>;
  if (!restaurant) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{restaurant.name}</h1>
          <p className="mt-0.5 text-sm text-ink/50">{restaurant.address ?? restaurant.cityId}</p>
        </div>
        <button
          onClick={toggleOpen}
          disabled={togglingOpen}
          className={`rounded-ticket px-4 py-2 text-sm font-medium disabled:opacity-60 ${
            restaurant.isOpen
              ? 'border border-pass-500 text-pass-700 hover:bg-pass-100'
              : 'border border-line text-ink/50 hover:border-ticket-500'
          }`}
        >
          {restaurant.isOpen ? 'Open · tap to close' : 'Closed · tap to open'}
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-line">
        {(['orders', 'menu'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'border-ticket-500 text-ticket-500' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {t === 'orders' ? 'Incoming orders' : 'Menu'}
          </button>
        ))}
      </div>

      {tab === 'orders' ? (
        <OwnerOrdersPanel restaurantId={restaurant.id} />
      ) : (
        <MenuEditor restaurantId={restaurant.id} items={menu} setItems={setMenu} />
      )}
    </div>
  );
}
