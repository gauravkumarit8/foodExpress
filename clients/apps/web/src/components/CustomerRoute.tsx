import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { UserRole } from '@foodexpress/api-client';
import { useAuth } from '../context/AuthContext';

/**
 * Guests (not logged in) and customers pass through untouched. A logged-in
 * restaurant_owner or rider gets redirected to their own home instead —
 * otherwise every role falls into the same customer ordering screens, which
 * is exactly the confusing "rider sees the customer app" bug this fixes.
 */
export function CustomerRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-ink/60">Loading…</div>;
  }
  if (user && user.role !== UserRole.CUSTOMER) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
