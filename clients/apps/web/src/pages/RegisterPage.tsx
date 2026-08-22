import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole, type SelfRegisterableRole } from '@foodexpress/api-client';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS: { value: SelfRegisterableRole; label: string }[] = [
  { value: UserRole.CUSTOMER, label: 'Order food' },
  { value: UserRole.RESTAURANT_OWNER, label: 'Run a restaurant' },
  { value: UserRole.RIDER, label: 'Deliver orders' },
];

export function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelfRegisterableRole>(UserRole.CUSTOMER);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ name, email, phone: phone || undefined, password, role });
      navigate('/');
    } catch {
      // error is already surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Create an account</h1>
      <p className="mt-1 text-sm text-ink/60">Takes less than a minute.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Full name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Phone (optional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
          <p className="mt-1 text-xs text-ink/40">At least 8 characters.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">I want to…</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-ticket border px-3 py-2 text-sm ${
                  role === opt.value ? 'border-ticket-500 bg-ticket-50' : 'border-line'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-ticket-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-ticket bg-ink py-2.5 font-medium text-paper hover:bg-ticket-500 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-ticket-500">
          Log in
        </Link>
      </p>
    </div>
  );
}
