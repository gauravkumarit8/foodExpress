import type { MenuItem } from '@foodexpress/api-client';

export function MenuItemRow({
  item,
  quantityInCart,
  onAdd,
}: {
  item: MenuItem;
  quantityInCart: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{item.name}</p>
        {item.description && <p className="text-sm text-ink/60">{item.description}</p>}
        <p className="mt-1 font-mono text-sm text-ink/80">₹{item.price.toFixed(2)}</p>
      </div>
      <button
        onClick={onAdd}
        disabled={!item.isAvailable}
        className="relative shrink-0 rounded-ticket border border-ink px-3 py-1.5 text-sm font-medium hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-line disabled:text-ink/30 disabled:hover:bg-transparent disabled:hover:text-ink/30"
      >
        {item.isAvailable ? 'Add' : 'Unavailable'}
        {quantityInCart > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ticket-500 font-mono text-xs text-white">
            {quantityInCart}
          </span>
        )}
      </button>
    </div>
  );
}
