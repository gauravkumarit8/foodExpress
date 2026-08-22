import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch {
      // error is already surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-ink">Log in</h1>
      <p className="mt-1 text-sm text-ink/60">Welcome back — let's get you fed.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          <label className="mb-1 block text-sm font-medium text-ink">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-ticket border border-line bg-white px-3 py-2 text-ink focus:border-ticket-500"
          />
        </div>

        {error && <p className="text-sm text-ticket-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-ticket bg-ink py-2.5 font-medium text-paper hover:bg-ticket-500 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New here?{' '}
        <Link to="/register" className="font-medium text-ticket-500">
          Create an account
        </Link>
      </p>
    </div>
  );
}
