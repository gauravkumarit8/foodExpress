import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { MenuItem, Restaurant } from '@foodexpress/api-client';

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
  /** True if the cart is empty or already belongs to this restaurant — safe to add without clearing. */
  canAddFrom: (restaurantId: string) => boolean;
  addItem: (restaurant: Restaurant, menuItem: MenuItem) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setNotes: (menuItemId: string, notes: string) => void;
  removeItem: (menuItemId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
}

const STORAGE_KEY = 'foodexpress:cart';
const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadInitialState(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartState;
  } catch {
    // corrupted/blocked storage — start fresh
  }
  return { restaurantId: null, restaurantName: null, lines: [] };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
    setState({ restaurantId: null, restaurantName: null, lines: [] });
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
