import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '@foodexpress/api-client';
import { useAuth } from '../context/AuthContext';

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-ink/60">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
