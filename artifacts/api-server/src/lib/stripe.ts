import Stripe from "stripe";

let cachedClient: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  if (cachedClient) return cachedClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  cachedClient = new Stripe(key, { apiVersion: "2025-03-31.basil" as Stripe.StripeConfig["apiVersion"] });
  return cachedClient;
}

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
