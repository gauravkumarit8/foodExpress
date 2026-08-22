import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Restaurant } from '@foodexpress/api-client';
import { api } from '../lib/api';
import { getCurrentPosition, type Coords } from '../lib/geolocation';
import { RestaurantCard } from '../components/RestaurantCard';

function CardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-ticket border border-line bg-white p-3">
      <div className="h-16 w-16 shrink-0 animate-pulse rounded-ticket bg-paper-dark" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-paper-dark" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-paper-dark" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-paper-dark" />
      </div>
    </div>
  );
}

export function RestaurantListPage() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPosition().then((c) => {
      setCoords(c);
      setLocating(false);
    });
  }, []);

  useEffect(() => {
    if (locating) return; // wait for the geolocation attempt to resolve first
    setLoading(true);
    setError(null);
    api.restaurants
      .browse({ lat: coords?.lat, lng: coords?.lng, page, limit: 20 })
      .then((result) => {
        setRestaurants((prev) => (page === 1 ? result.data : [...prev, ...result.data]));
        setTotalPages(result.totalPages);
      })
      .catch(() => setError('Could not load restaurants. Pull to refresh and try again.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locating, coords, page]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Restaurants near you</h1>
        {!coords && !locating && (
          <span className="text-xs text-ink/40">Showing all open restaurants</span>
        )}
      </div>

      {error && <p className="rounded-ticket bg-ticket-50 p-3 text-sm text-ticket-700">{error}</p>}

      {loading && page === 1 ? (
        <div className="grid grid-cols-1 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <p className="py-12 text-center text-ink/50">No restaurants found nearby yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {restaurants.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
            >
              <RestaurantCard restaurant={r} />
            </motion.div>
          ))}
        </div>
      )}

      {page < totalPages && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="mt-6 w-full rounded-ticket border border-line py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:border-ticket-500 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
