import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  rider: 'Rider',
  admin: 'Admin',
};

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Profile</h1>
      <div className="mt-6 space-y-4 rounded-ticket border border-line bg-white p-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/40">Name</p>
          <p className="text-ink">{user.name}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/40">Email</p>
          <p className="text-ink">{user.email}</p>
        </div>
        {user.phone && (
          <div>
            <p className="text-xs uppercase tracking-widest text-ink/40">Phone</p>
            <p className="text-ink">{user.phone}</p>
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/40">Account type</p>
          <p className="text-ink">{ROLE_LABEL[user.role] ?? user.role}</p>
        </div>
      </div>

      {user.role === 'restaurant_owner' && (
        <Link
          to="/owner"
          className="mt-4 inline-block rounded-ticket bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ticket-500"
        >
          Go to restaurant dashboard
        </Link>
      )}
      {user.role === 'rider' && (
        <p className="mt-4 text-sm text-ink/50">
          The rider delivery app is coming in the next phase of this app.
        </p>
      )}
    </div>
  );
}
