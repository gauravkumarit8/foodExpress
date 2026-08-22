import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserRole } from '@foodexpress/api-client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { AccountMenu } from './AccountMenu';

export function NavBar() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const showCustomerNav = !user || user.role === UserRole.CUSTOMER;

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold tracking-tight text-ink">
          Food<span className="text-ticket-500">Express</span>
        </Link>
        <nav className="flex items-center gap-4 font-body text-sm">
          {showCustomerNav && user && (
            <Link to="/orders" className="text-ink transition-colors hover:text-ticket-500">
              Orders
            </Link>
          )}
          {user?.role === UserRole.RESTAURANT_OWNER && (
            <Link to="/owner" className="text-ink transition-colors hover:text-ticket-500">
              Dashboard
            </Link>
          )}
          {showCustomerNav && (
            <Link
              to="/cart"
              className="relative rounded-ticket border border-ink px-3 py-1.5 font-medium transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              Cart
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ticket-500 font-mono text-xs text-white"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )}
          {user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <Link to="/login" className="text-ink transition-colors hover:text-ticket-500">
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-ticket bg-ink px-3 py-1.5 font-medium text-paper transition-colors duration-150 hover:bg-ticket-500"
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
