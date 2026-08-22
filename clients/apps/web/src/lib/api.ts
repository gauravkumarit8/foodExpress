import { ApiClient, type TokenStorage } from '@foodexpress/api-client';

const TOKEN_KEY = 'foodexpress:token';

const localStorageTokenStorage: TokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// Vite exposes env vars prefixed with VITE_ via import.meta.env — see .env.example.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const api = new ApiClient({
  baseUrl,
  storage: localStorageTokenStorage,
  onUnauthorized: () => {
    localStorageTokenStorage.clearToken();
    // A full reload is the simplest reliable way to reset all in-memory
    // state (cart, auth context) when a token silently expires mid-session.
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  },
});
