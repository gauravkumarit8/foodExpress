import { Navigate } from 'react-router-dom';
import { UserRole } from '@foodexpress/api-client';
import { useAuth } from '../context/AuthContext';
import { RestaurantListPage } from '../pages/RestaurantListPage';
import { RiderLandingPage } from '../pages/RiderLandingPage';

export function RoleAwareHome() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-ink/60">Loading…</div>;
  }
  if (user?.role === UserRole.RESTAURANT_OWNER) {
    return <Navigate to="/owner" replace />;
  }
  if (user?.role === UserRole.RIDER) {
    return <RiderLandingPage />;
  }
  // Guests and customers both browse restaurants.
  return <RestaurantListPage />;
}
