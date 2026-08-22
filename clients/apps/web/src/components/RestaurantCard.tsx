import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Restaurant } from '@foodexpress/api-client';
import { RestaurantThumb } from './RestaurantThumb';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.15 }}>
      <Link
        to={`/restaurants/${restaurant.id}`}
        className="group flex items-center gap-4 rounded-ticket border border-line bg-white p-3 shadow-sm transition-shadow duration-200 hover:border-ticket-500 hover:shadow-md"
      >
        <RestaurantThumb src={restaurant.imageUrl} alt={restaurant.name} size={64} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold text-ink transition-colors group-hover:text-ticket-500">
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
    </motion.div>
  );
}
