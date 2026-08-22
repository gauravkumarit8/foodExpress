import { Link } from 'react-router-dom';
import type { Restaurant } from '@foodexpress/api-client';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="group flex items-center gap-4 rounded-ticket border border-line bg-white p-3 transition hover:border-ticket-500"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-ticket bg-paper-dark">
        {restaurant.imageUrl && (
          <img src={restaurant.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-bold text-ink group-hover:text-ticket-500">
          {restaurant.name}
        </h3>
        {restaurant.description && (
          <p className="truncate text-sm text-ink/60">{restaurant.description}</p>
        )}
        <p className="mt-1 font-mono text-xs text-ink/50">
          ~{restaurant.avgPrepTimeMinutes} min
          {!restaurant.isOpen && <span className="ml-2 text-ticket-500">· Closed</span>}
        </p>
      </div>
    </Link>
  );
}
