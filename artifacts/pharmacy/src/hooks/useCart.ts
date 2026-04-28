import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand?: string | null;
  imageUrl: string;
  unitPriceGbp: number;
  quantity: number;
};

const STORAGE_KEY = "pharmacare_cart_v1";

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i: unknown): i is CartItem =>
      !!i && typeof i === "object" && "productId" in i! && "quantity" in i!
    );
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  useEffect(() => {
    const sync = () => setItems(readCart());
    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    const current = readCart();
    const existing = current.find(i => i.productId === item.productId);
    let next: CartItem[];
    if (existing) {
      next = current.map(i =>
        i.productId === item.productId ? { ...i, quantity: Math.min(20, i.quantity + qty) } : i
      );
    } else {
      next = [...current, { ...item, quantity: Math.min(20, Math.max(1, qty)) }];
    }
    writeCart(next);
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    const next = readCart().map(i =>
      i.productId === productId ? { ...i, quantity: Math.min(20, Math.max(1, qty)) } : i
    );
    writeCart(next);
  }, []);

  const removeItem = useCallback((productId: string) => {
    writeCart(readCart().filter(i => i.productId !== productId));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const itemsTotal = items.reduce((sum, i) => sum + i.unitPriceGbp * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping = itemsTotal === 0 ? 0 : itemsTotal >= 2500 ? 0 : 299;
  const total = itemsTotal + shipping;

  return { items, addItem, updateQty, removeItem, clear, itemsTotal, shipping, total, itemCount };
}

export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
