import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, type LoginRequest, type RegisterRequest, type User } from '@foodexpress/api-client';
import { api } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (dto: LoginRequest) => Promise<void>;
  register: (dto: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function loadFullProfile(): Promise<User> {
  const claims = await api.auth.me();
  return api.users.getProfile(claims.userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFullProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(dto: LoginRequest) {
    setError(null);
    try {
      const { accessToken } = await api.auth.login(dto);
      await api.auth.setToken(accessToken);
      setUser(await loadFullProfile());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
      throw err;
    }
  }

  async function register(dto: RegisterRequest) {
    setError(null);
    try {
      const { accessToken } = await api.auth.register(dto);
      await api.auth.setToken(accessToken);
      setUser(await loadFullProfile());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Try again.');
      throw err;
    }
  }

  function logout() {
    api.auth.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
