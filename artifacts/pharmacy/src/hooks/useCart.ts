import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand?: string | null;
  imageUrl: string;
  unitPriceGbp: number;
  quantity: number;
  category?: string | null;
};

const STORAGE_KEY = "pharmacare_cart_v1";

// Bundle / multi-buy discounts that run automatically in the cart.
// Keep the rules data-driven so we can add more without touching the hook.
export type BundleRule = {
  id: string;
  label: string;
  // Slugs of products this rule applies to.
  slugMatches?: string[];
  // Categories this rule applies to (matches CartItem.category).
  categoryMatches?: string[];
  // "3-for-2" style: every Nth qualifying unit is free.
  freeEvery?: number;
  // Flat percentage off all matching units when minQty is met.
  percentOff?: number;
  minQty?: number;
};

// Source-of-truth product categories live in the seeded catalog (lib/db/src/seed-products.ts).
// We match by category so the rule keeps working even as the catalogue grows.
const BUNDLE_RULES: BundleRule[] = [
  {
    id: "vitamins-3-for-2",
    label: "3 for 2 on vitamins",
    categoryMatches: ["vitamins"],
    freeEvery: 3,
  },
];

const itemMatchesRule = (item: CartItem, rule: BundleRule): boolean => {
  if (rule.slugMatches && rule.slugMatches.includes(item.slug)) return true;
  if (rule.categoryMatches && item.category && rule.categoryMatches.includes(item.category)) return true;
  return false;
};

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

export type AppliedDiscount = { ruleId: string; label: string; amountPence: number };

export function calculateBundleDiscounts(items: CartItem[]): AppliedDiscount[] {
  const out: AppliedDiscount[] = [];
  for (const rule of BUNDLE_RULES) {
    const matching = items.filter((i) => itemMatchesRule(i, rule));
    if (matching.length === 0) continue;

    if (rule.freeEvery) {
      // Expand to per-unit prices, sort ascending, mark every Nth (cheapest) free.
      const units: number[] = [];
      for (const it of matching) {
        for (let i = 0; i < it.quantity; i++) units.push(it.unitPriceGbp);
      }
      units.sort((a, b) => a - b);
      const freeCount = Math.floor(units.length / rule.freeEvery);
      let amount = 0;
      for (let i = 0; i < freeCount; i++) amount += units[i] ?? 0;
      if (amount > 0) out.push({ ruleId: rule.id, label: rule.label, amountPence: amount });
    }

    if (rule.percentOff && rule.minQty) {
      const totalQty = matching.reduce((s, i) => s + i.quantity, 0);
      if (totalQty >= rule.minQty) {
        const subtotal = matching.reduce((s, i) => s + i.unitPriceGbp * i.quantity, 0);
        out.push({
          ruleId: rule.id,
          label: rule.label,
          amountPence: Math.round((subtotal * rule.percentOff) / 100),
        });
      }
    }
  }
  return out;
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
    if (qty <= 0) {
      writeCart(readCart().filter(i => i.productId !== productId));
      return;
    }
    const next = readCart().map(i =>
      i.productId === productId ? { ...i, quantity: Math.min(20, qty) } : i
    );
    writeCart(next);
  }, []);

  const removeItem = useCallback((productId: string) => {
    writeCart(readCart().filter(i => i.productId !== productId));
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const itemsTotal = items.reduce((sum, i) => sum + i.unitPriceGbp * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const discounts = calculateBundleDiscounts(items);
  const discountTotal = discounts.reduce((s, d) => s + d.amountPence, 0);
  const itemsTotalAfterDiscount = Math.max(0, itemsTotal - discountTotal);
  const shipping = itemsTotalAfterDiscount === 0 ? 0 : itemsTotalAfterDiscount >= 2500 ? 0 : 299;
  const total = itemsTotalAfterDiscount + shipping;

  return { items, addItem, updateQty, removeItem, clear, itemsTotal, itemsTotalAfterDiscount, discounts, discountTotal, shipping, total, itemCount };
}

export function formatGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
