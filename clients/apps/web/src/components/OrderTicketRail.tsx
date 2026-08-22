import { ORDER_STATUS_LABEL, ORDER_STATUS_SEQUENCE, OrderStatus, type Order } from '@foodexpress/api-client';

const KITCHEN_STEPS = [OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY];
const DELIVERY_STEPS = [OrderStatus.PICKED_UP, OrderStatus.DELIVERED];

function StatusRow({
  status,
  state,
}: {
  status: OrderStatus;
  state: 'done' | 'current' | 'upcoming';
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs',
          state === 'done' && 'border-ink bg-ink text-paper',
          state === 'current' && 'animate-pulse border-ticket-500 bg-ticket-500 text-white',
          state === 'upcoming' && 'border-line text-ink/30',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {state === 'done' ? '✓' : ''}
      </span>
      <span
        className={[
          'font-medium',
          state === 'upcoming' ? 'text-ink/30' : 'text-ink',
          state === 'current' && 'text-ticket-500',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {ORDER_STATUS_LABEL[status]}
      </span>
    </div>
  );
}

export function OrderTicketRail({ order }: { order: Order }) {
  if (order.status === OrderStatus.CANCELLED) {
    return (
      <div className="rounded-ticket border-2 border-dashed border-ticket-500 bg-white p-6 text-center">
        <p className="font-display text-2xl font-bold tracking-widest text-ticket-500">VOID</p>
        <p className="mt-1 text-sm text-ink/60">This order was cancelled.</p>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.status);
  const stateFor = (status: OrderStatus): 'done' | 'current' | 'upcoming' => {
    const idx = ORDER_STATUS_SEQUENCE.indexOf(status);
    if (idx < currentIndex) return 'done';
    if (idx === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="overflow-hidden rounded-ticket border border-line bg-white shadow-sm">
      <div className="px-5 pb-1 pt-4">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/50">
          Order #{order.id.slice(0, 8)}
        </p>
        <p className="mt-0.5 font-mono text-xs text-ink/40">
          Placed {new Date(order.placedAt).toLocaleString()}
        </p>
      </div>
      <div className="px-5 py-2">
        {KITCHEN_STEPS.map((status) => (
          <StatusRow key={status} status={status} state={stateFor(status)} />
        ))}
      </div>
      <div className="ticket-tear" aria-hidden />
      <div className="px-5 py-2">
        {DELIVERY_STEPS.map((status) => (
          <StatusRow key={status} status={status} state={stateFor(status)} />
        ))}
      </div>
    </div>
  );
}
