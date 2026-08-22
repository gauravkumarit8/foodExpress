import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserRole, type User } from '@foodexpress/api-client';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  rider: 'Rider',
  admin: 'Admin',
};

function initialsOf(user: User): string {
  const parts = user.name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export function AccountMenu({ user }: { user: User }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-paper transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {initialsOf(user)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-11 z-20 w-64 overflow-hidden rounded-ticket border border-line bg-white shadow-lg"
          >
            <div className="border-b border-line bg-paper px-4 py-3">
              <p className="truncate font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink/50">{user.email}</p>
              <span className="mt-1.5 inline-block rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-ink/60">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
            <div className="py-1">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-paper"
              >
                Profile
              </Link>
              {user.role === UserRole.RESTAURANT_OWNER && (
                <Link
                  to="/owner"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-ink hover:bg-paper"
                >
                  Restaurant dashboard
                </Link>
              )}
              {user.role === UserRole.CUSTOMER && (
                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-ink hover:bg-paper"
                >
                  Your orders
                </Link>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="block w-full px-4 py-2 text-left text-sm text-ticket-500 hover:bg-ticket-50"
              >
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
