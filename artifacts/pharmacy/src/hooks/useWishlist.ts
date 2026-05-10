import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "pharmacare:wishlist:v1";
const EVENT = "pharmacare:wishlist-changed";

type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  unitPriceGbp: number;
  addedAt: number;
};

const read = (): WishlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as WishlistItem[];
  } catch {
    return [];
  }
};

const write = (items: WishlistItem[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
};

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>(() => read());

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((it: Omit<WishlistItem, "addedAt">) => {
    const current = read();
    const exists = current.some((x) => x.productId === it.productId);
    const next = exists
      ? current.filter((x) => x.productId !== it.productId)
      : [...current, { ...it, addedAt: Date.now() }];
    write(next);
    return !exists;
  }, []);

  const has = useCallback((productId: string) => items.some((x) => x.productId === productId), [items]);

  const remove = useCallback((productId: string) => {
    write(read().filter((x) => x.productId !== productId));
  }, []);

  return { items, toggle, has, remove, count: items.length };
}

const RECENT_KEY = "pharmacare:recently-viewed:v1";
const RECENT_EVENT = "pharmacare:recently-viewed-changed";

export type RecentlyViewedItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  unitPriceGbp: number;
  viewedAt: number;
};

export function recordRecentlyViewed(item: Omit<RecentlyViewedItem, "viewedAt">): void {
  if (typeof window === "undefined") return;
  let current: RecentlyViewedItem[] = [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (raw) current = JSON.parse(raw) as RecentlyViewedItem[];
    if (!Array.isArray(current)) current = [];
  } catch {
    current = [];
  }
  const filtered = current.filter((x) => x.productId !== item.productId);
  const next = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, 12);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(RECENT_EVENT));
}

export function useRecentlyViewed(excludeProductId?: string) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem(RECENT_KEY);
        const parsed = raw ? (JSON.parse(raw) as RecentlyViewedItem[]) : [];
        const filtered = excludeProductId ? parsed.filter((x) => x.productId !== excludeProductId) : parsed;
        setItems(Array.isArray(filtered) ? filtered : []);
      } catch {
        setItems([]);
      }
    };
    load();
    window.addEventListener(RECENT_EVENT, load);
    return () => window.removeEventListener(RECENT_EVENT, load);
  }, [excludeProductId]);
  return items;
}
