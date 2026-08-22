import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function NavBar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-ink">
          Food<span className="text-ticket-500">Express</span>
        </Link>
        <nav className="flex items-center gap-4 font-body text-sm">
          {user ? (
            <>
              {user.role === 'restaurant_owner' && (
                <Link to="/owner" className="hover:text-ticket-500">
                  Dashboard
                </Link>
              )}
              <Link to="/orders" className="hover:text-ticket-500">
                Orders
              </Link>
              <Link to="/profile" className="hover:text-ticket-500">
                Profile
              </Link>
              <Link
                to="/cart"
                className="relative rounded-ticket border border-ink px-3 py-1.5 font-medium hover:bg-ink hover:text-paper"
              >
                Cart
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ticket-500 font-mono text-xs text-white">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-ink/60 hover:text-ticket-500"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-ticket-500">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-ticket bg-ink px-3 py-1.5 font-medium text-paper hover:bg-ticket-500"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
