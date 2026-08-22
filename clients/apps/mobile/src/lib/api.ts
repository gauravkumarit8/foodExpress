import * as SecureStore from 'expo-secure-store';
import { ApiClient, type TokenStorage } from '@foodexpress/api-client';
import { API_BASE_URL } from '../config';

const TOKEN_KEY = 'foodexpress-token';

// expo-secure-store keys support only alphanumerics, ".", "-" and "_" — the
// constant above already satisfies that, called out here so it stays true
// if this key is ever renamed.
const secureStoreTokenStorage: TokenStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const api = new ApiClient({
  baseUrl: API_BASE_URL,
  storage: secureStoreTokenStorage,
  // Navigation-based redirect on 401 is handled by AuthContext reacting to
  // failed session checks, rather than a hard reload (there's no browser
  // location to reset here).
});
