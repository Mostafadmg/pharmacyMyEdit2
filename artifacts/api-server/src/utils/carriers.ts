export type CarrierKey = "royal_mail" | "dpd" | "evri" | "pharmacare_express";

interface CarrierMeta {
  key: CarrierKey;
  label: string;
  trackingUrl: (trackingNumber: string, orderId?: string) => string;
}

const CARRIERS: Record<CarrierKey, CarrierMeta> = {
  royal_mail: {
    key: "royal_mail",
    label: "Royal Mail",
    trackingUrl: (t) =>
      `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(t)}`,
  },
  dpd: {
    key: "dpd",
    label: "DPD",
    trackingUrl: (t) => `https://track.dpd.co.uk/parcels/${encodeURIComponent(t)}`,
  },
  evri: {
    key: "evri",
    label: "Evri",
    trackingUrl: (t) =>
      `https://www.evri.com/track/parcel/${encodeURIComponent(t)}/details`,
  },
  pharmacare_express: {
    key: "pharmacare_express",
    label: "PharmaCare Express",
    // Internal courier — link the patient back to our own tracking timeline.
    // Falls back to the generic /my-orders page if we somehow lack an orderId.
    trackingUrl: (_t, orderId) =>
      orderId ? `/order-confirmation/${encodeURIComponent(orderId)}` : `/my-orders`,
  },
};

function normaliseCarrier(input: string | null | undefined): CarrierKey {
  if (!input) return "pharmacare_express";
  const v = input.trim().toLowerCase();
  if (v === "royal mail" || v === "royal_mail" || v === "royalmail") return "royal_mail";
  if (v === "dpd") return "dpd";
  if (v === "evri" || v === "hermes") return "evri";
  return "pharmacare_express";
}

export function getCarrierLabel(input: string | null | undefined): string {
  return CARRIERS[normaliseCarrier(input)].label;
}

export function buildTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string,
  explicitUrl?: string | null,
  orderId?: string,
): string {
  if (explicitUrl && /^https?:\/\//i.test(explicitUrl)) return explicitUrl;
  return CARRIERS[normaliseCarrier(carrier)].trackingUrl(trackingNumber, orderId);
}

export const CARRIER_OPTIONS = Object.values(CARRIERS).map((c) => ({
  value: c.label,
  label: c.label,
}));
