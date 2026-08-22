import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Restaurant } from '@foodexpress/api-client';
import { api } from '../../lib/api';

export function MyRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.restaurants
      .mine()
      .then(setRestaurants)
      .catch(() => setError('Could not load your restaurants.'));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Your restaurants</h1>
        <Link
          to="/owner/new"
          className="rounded-ticket bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ticket-500"
        >
          + New restaurant
        </Link>
      </div>

      {error && <p className="text-sm text-ticket-500">{error}</p>}

      {restaurants === null ? (
        <p className="py-12 text-center text-ink/50">Loading…</p>
      ) : restaurants.length === 0 ? (
        <div className="rounded-ticket border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="font-medium text-ink">No restaurants yet</p>
          <p className="mt-1 text-sm text-ink/60">Create your first listing to start taking orders.</p>
          <Link
            to="/owner/new"
            className="mt-4 inline-block rounded-ticket bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ticket-500"
          >
            Create a restaurant
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              to={`/owner/restaurants/${r.id}`}
              className="flex items-center justify-between rounded-ticket border border-line bg-white p-4 hover:border-ticket-500"
            >
              <div>
                <p className="font-medium text-ink">{r.name}</p>
                <p className="mt-0.5 font-mono text-xs text-ink/40">{r.address ?? r.cityId}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  r.isOpen ? 'bg-pass-100 text-pass-700' : 'bg-ticket-50 text-ticket-700'
                }`}
              >
                {r.isOpen ? 'Open' : 'Closed'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
