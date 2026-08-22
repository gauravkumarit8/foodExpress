import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">Your cart is empty</p>
        <p className="mt-1 text-sm text-ink/60">Find something good to eat.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-ticket bg-ink px-5 py-2.5 font-medium text-paper hover:bg-ticket-500"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-ink">Your cart</h1>
      <p className="mt-1 text-sm text-ink/60">From {cart.restaurantName}</p>

      <div className="mt-4 divide-y divide-line rounded-ticket border border-line bg-white px-4">
        {cart.lines.map((line) => (
          <div key={line.menuItem.id} className="py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{line.menuItem.name}</p>
                <p className="font-mono text-sm text-ink/60">₹{line.menuItem.price.toFixed(2)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => cart.updateQuantity(line.menuItem.id, line.quantity - 1)}
                  className="h-7 w-7 rounded-ticket border border-line font-mono hover:border-ticket-500"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-5 text-center font-mono">{line.quantity}</span>
                <button
                  onClick={() => cart.updateQuantity(line.menuItem.id, line.quantity + 1)}
                  className="h-7 w-7 rounded-ticket border border-line font-mono hover:border-ticket-500"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
            <input
              placeholder="Add a note (e.g. no onions)"
              value={line.notes ?? ''}
              onChange={(e) => cart.setNotes(line.menuItem.id, e.target.value)}
              maxLength={200}
              className="mt-2 w-full rounded-ticket border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:border-ticket-500"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-ticket border border-line bg-white px-4 py-3">
        <span className="font-medium text-ink">Subtotal</span>
        <span className="font-mono font-bold text-ink">₹{cart.subtotal.toFixed(2)}</span>
      </div>
      <p className="mt-1 text-right text-xs text-ink/40">+ delivery fee at checkout</p>

      <button
        onClick={() => navigate('/checkout')}
        className="mt-6 w-full rounded-ticket bg-ink py-3 font-medium text-paper hover:bg-ticket-500"
      >
        Proceed to checkout
      </button>
      <button onClick={() => cart.clear()} className="mt-3 w-full text-center text-sm text-ink/40 hover:text-ticket-500">
        Clear cart
      </button>
    </div>
  );
}
