import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import * as cartService from '../services/cartService';

const STORAGE_KEY = 'mayil_cart';

const CartContext = createContext(null);

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }) {
  const { customer } = useAuth();
  const [items, setItems] = useState([]);
  const prevCustomerRef = useRef(null);

  const loadFromApi = useCallback(async () => {
    try {
      const data = await cartService.getCart();
      setItems(data ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (customer) {
      const justLoggedIn = prevCustomerRef.current === null;
      if (justLoggedIn) {
        const guestItems = readLocal();
        cartService.mergeCart(guestItems)
          .then((merged) => {
            setItems(merged ?? []);
            localStorage.removeItem(STORAGE_KEY);
          })
          .catch(() => loadFromApi());
      } else {
        loadFromApi();
      }
    } else {
      const local = readLocal();
      setItems(local);
    }
    prevCustomerRef.current = customer;
  }, [customer, loadFromApi]);

  const cartCount = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  const add = useCallback(
    async (variantId, quantity = 1, meta = {}) => {
      if (customer) {
        const item = await cartService.addToCart(variantId, quantity);
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.variantId === variantId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = item;
            return updated;
          }
          return [...prev, item];
        });
      } else {
        const local = readLocal();
        const idx = local.findIndex((i) => i.variantId === variantId);
        const newItem = { variantId, quantity, ...meta };
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...newItem };
        } else {
          local.push(newItem);
        }
        writeLocal(local);
        setItems(local);
      }
    },
    [customer]
  );

  const update = useCallback(
    async (variantId, quantity) => {
      if (customer) {
        const item = await cartService.updateCartItem(variantId, quantity);
        setItems((prev) => prev.map((i) => (i.variantId === variantId ? item : i)));
      } else {
        const local = readLocal().map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
        writeLocal(local);
        setItems(local);
      }
    },
    [customer]
  );

  const remove = useCallback(
    async (variantId) => {
      if (customer) {
        await cartService.removeFromCart(variantId);
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
      } else {
        const local = readLocal().filter((i) => i.variantId !== variantId);
        writeLocal(local);
        setItems(local);
      }
    },
    [customer]
  );

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return (
    <CartContext.Provider value={{ items, cartCount, add, update, remove, clear, refresh: loadFromApi }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
