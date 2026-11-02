import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import * as wishlistService from '../services/wishlistService';

const STORAGE_KEY = 'mayil_wishlist';

const WishlistContext = createContext(null);

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(productIds) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productIds));
}

export function WishlistProvider({ children }) {
  const { customer } = useAuth();
  const [items, setItems] = useState([]);
  const prevCustomerRef = useRef(null);

  const loadFromApi = useCallback(async () => {
    try {
      const data = await wishlistService.getWishlist();
      setItems(data ?? []);
    } catch {
      setItems([]);
    }
  }, []);

  // Sync items from localStorage or API based on auth state
  useEffect(() => {
    if (customer) {
      const justLoggedIn = prevCustomerRef.current === null;
      if (justLoggedIn) {
        const guestIds = readLocal();
        wishlistService.mergeWishlist(guestIds)
          .then((merged) => {
            setItems(merged ?? []);
            localStorage.removeItem(STORAGE_KEY);
          })
          .catch(() => loadFromApi());
      } else {
        loadFromApi();
      }
    } else {
      const localIds = readLocal();
      setItems(localIds.map((productId) => ({ productId })));
    }
    prevCustomerRef.current = customer;
  }, [customer, loadFromApi]);

  const isInWishlist = useCallback(
    (productId) => items.some((item) => item.productId === productId),
    [items]
  );

  const add = useCallback(
    async (productId) => {
      if (customer) {
        const item = await wishlistService.addToWishlist(productId);
        setItems((prev) => (prev.some((i) => i.productId === productId) ? prev : [...prev, item]));
      } else {
        const ids = readLocal();
        if (!ids.includes(productId)) {
          const updated = [...ids, productId];
          writeLocal(updated);
          setItems(updated.map((id) => ({ productId: id })));
        }
      }
    },
    [customer]
  );

  const remove = useCallback(
    async (productId) => {
      if (customer) {
        await wishlistService.removeFromWishlist(productId);
        setItems((prev) => prev.filter((i) => i.productId !== productId));
      } else {
        const updated = readLocal().filter((id) => id !== productId);
        writeLocal(updated);
        setItems(updated.map((id) => ({ productId: id })));
      }
    },
    [customer]
  );

  const toggle = useCallback(
    async (productId) => {
      if (isInWishlist(productId)) {
        await remove(productId);
      } else {
        await add(productId);
      }
    },
    [isInWishlist, add, remove]
  );

  return (
    <WishlistContext.Provider value={{ items, isInWishlist, add, remove, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
