import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  rider: 'Rider',
  admin: 'Admin',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
}

export function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mx-auto max-w-sm px-4 py-10"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-paper">
          {initialsOf(user.name)}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{user.name}</h1>
          <span className="mt-0.5 inline-block rounded-full bg-paper-dark px-2 py-0.5 text-xs font-medium text-ink/60">
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-ticket border border-line bg-white p-5">
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
      </div>

      {user.role === 'restaurant_owner' && (
        <Link
          to="/owner"
          className="mt-4 inline-block rounded-ticket bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors duration-150 hover:bg-ticket-500"
        >
          Go to restaurant dashboard
        </Link>
      )}
      {user.role === 'rider' && (
        <p className="mt-4 text-sm text-ink/50">
          The rider delivery app is coming in the next phase of this app.
        </p>
      )}
    </motion.div>
  );
}
