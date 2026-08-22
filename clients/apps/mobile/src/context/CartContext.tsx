import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MenuItem, Restaurant } from '@foodexpress/api-client';
import { useAuth } from './AuthContext';

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  canAddFrom: (restaurantId: string) => boolean;
  addItem: (restaurant: Restaurant, menuItem: MenuItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setNotes: (menuItemId: string, notes: string) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const EMPTY_CART: CartState = { restaurantId: null, restaurantName: null, lines: [] };
const CartContext = createContext<CartContextValue | undefined>(undefined);

// In-memory for this scaffold — cart resets on app restart. Swap in
// @react-native-async-storage/async-storage (mirroring the web app's
// localStorage persistence) if you want it to survive restarts.
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<CartState>(EMPTY_CART);

  // Without this, logging out of one account and into another in the same
  // app session keeps showing the first account's cart — the same bug
  // fixed on web, just without localStorage to key off of here.
  useEffect(() => {
    setState(EMPTY_CART);
  }, [user?.id]);

  function canAddFrom(restaurantId: string) {
    return state.restaurantId === null || state.restaurantId === restaurantId;
  }

  function addItem(restaurant: Restaurant, menuItem: MenuItem) {
    setState((prev) => {
      const base: CartState =
        prev.restaurantId === restaurant.id
          ? prev
          : { restaurantId: restaurant.id, restaurantName: restaurant.name, lines: [] };
      const existing = base.lines.find((l) => l.menuItem.id === menuItem.id);
      const lines = existing
        ? base.lines.map((l) =>
            l.menuItem.id === menuItem.id ? { ...l, quantity: l.quantity + 1 } : l,
          )
        : [...base.lines, { menuItem, quantity: 1 }];
      return { ...base, lines };
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    setState((prev) => ({
      ...prev,
      lines:
        quantity <= 0
          ? prev.lines.filter((l) => l.menuItem.id !== menuItemId)
          : prev.lines.map((l) => (l.menuItem.id === menuItemId ? { ...l, quantity } : l)),
    }));
  }

  function setNotes(menuItemId: string, notes: string) {
    setState((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.menuItem.id === menuItemId ? { ...l, notes } : l)),
    }));
  }

  function removeItem(menuItemId: string) {
    updateQuantity(menuItemId, 0);
  }

  function clear() {
    setState(EMPTY_CART);
  }

  const subtotal = state.lines.reduce((sum, l) => sum + l.menuItem.price * l.quantity, 0);
  const itemCount = state.lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        canAddFrom,
        addItem,
        updateQuantity,
        setNotes,
        removeItem,
        clear,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
