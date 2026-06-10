// Delivery provider abstraction. Today only the Mock provider exists; future
// integrations (Royal Mail, DPD, Yodel, etc.) implement the same interface.

export type DeliveryStage = "preparing" | "shipped" | "out_for_delivery" | "delivered" | "exception";

export interface DeliveryEvent {
  ts: string;
  status: DeliveryStage;
  message: string;
  location?: string;
}

export interface CreateDeliveryRequest {
  orderId: string;
  customerName: string;
  shippingAddress: { line1: string; line2?: string; city: string; postcode: string; country?: string };
}

export interface CreateDeliveryResult {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery: Date;
}

export interface DeliveryProvider {
  name: string;
  createShipment(req: CreateDeliveryRequest): Promise<CreateDeliveryResult>;
  /** Translate a generic stage into a customer-facing message. */
  describeStage(stage: DeliveryStage): string;
}

class MockDeliveryProvider implements DeliveryProvider {
  name = "EveryDayMeds Express";

  async createShipment(req: CreateDeliveryRequest): Promise<CreateDeliveryResult> {
    const tracking = `PCEX${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const eta = new Date();
    eta.setDate(eta.getDate() + 2);
    return {
      carrier: this.name,
      trackingNumber: tracking,
      trackingUrl: `/my-orders`,
      estimatedDelivery: eta,
    };
  }

  describeStage(stage: DeliveryStage): string {
    switch (stage) {
      case "preparing": return "Your order is being prepared by our pharmacy team.";
      case "shipped": return "Your order has been dispatched and is on its way.";
      case "out_for_delivery": return "Out for delivery — expected today.";
      case "delivered": return "Delivered. Thanks for shopping with EveryDayMeds.";
      case "exception": return "There was an issue with delivery — we'll be in touch shortly.";
    }
  }
}

const provider: DeliveryProvider = new MockDeliveryProvider();
export function getDeliveryProvider(): DeliveryProvider {
  return provider;
}
