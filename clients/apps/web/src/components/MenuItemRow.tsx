import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem } from '@foodexpress/api-client';

export function MenuItemRow({
  item,
  quantityInCart,
  onAdd,
  onDecrement,
}: {
  item: MenuItem;
  quantityInCart: number;
  /** Omit both handlers to render the row read-only (e.g. an owner/rider just viewing the menu). */
  onAdd?: () => void;
  onDecrement?: () => void;
}) {
  const canOrder = !!onAdd;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{item.name}</p>
        {item.description && <p className="text-sm text-ink/60">{item.description}</p>}
        <p className="mt-1 font-mono text-sm text-ink/80">₹{item.price.toFixed(2)}</p>
      </div>

      {canOrder && (
        <AnimatePresence mode="wait" initial={false}>
          {quantityInCart > 0 ? (
            <motion.div
              key="stepper"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex shrink-0 items-center gap-1 rounded-ticket border border-ticket-500 bg-ticket-50 px-1 py-1"
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onDecrement}
                aria-label={`Remove one ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-ticket text-ticket-700 hover:bg-white"
              >
                −
              </motion.button>
              <span className="w-5 text-center font-mono text-sm font-medium text-ticket-700">
                {quantityInCart}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onAdd}
                disabled={!item.isAvailable}
                aria-label={`Add one more ${item.name}`}
                className="flex h-7 w-7 items-center justify-center rounded-ticket text-ticket-700 hover:bg-white disabled:opacity-40"
              >
                +
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              whileTap={item.isAvailable ? { scale: 0.94 } : undefined}
              onClick={onAdd}
              disabled={!item.isAvailable}
              className="shrink-0 rounded-ticket border border-ink px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:text-ink/30 disabled:hover:bg-transparent disabled:hover:text-ink/30"
            >
              {item.isAvailable ? 'Add' : 'Unavailable'}
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
