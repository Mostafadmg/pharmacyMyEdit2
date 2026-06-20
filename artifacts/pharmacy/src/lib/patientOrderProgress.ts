import { ORDER_PROGRESS_STEPS } from "@/data/patientAccountNav";
import {
  doseLadderFor,
  formatProductDose,
  type WlProduct,
} from "@/lib/wlEligibilityDosing";

export type OrderProgressBadge = "Pending" | "Fulfilled" | "Cancelled";

export type OrderProgressState = {
  activeStep: number;
  statusLabel: string;
  badge: OrderProgressBadge;
  allComplete: boolean;
  fillPercent: number;
};

type ConsultationLike = {
  status: string;
  documentsNeedAttention?: boolean;
  dispatchedAt?: string | null;
};

export function progressForConsultation(c: ConsultationLike): OrderProgressState {
  if (c.status === "cancelled" || c.status === "rejected") {
    return {
      activeStep: 0,
      statusLabel: c.status === "rejected" ? "Rejected" : "Cancelled",
      badge: "Cancelled",
      allComplete: false,
      fillPercent: 0,
    };
  }

  if (c.dispatchedAt) {
    return {
      activeStep: 5,
      statusLabel: "Dispatched",
      badge: "Fulfilled",
      allComplete: true,
      fillPercent: 100,
    };
  }

  if (c.status === "approved") {
    return {
      activeStep: 4,
      statusLabel: "Ready for Dispatch",
      badge: "Pending",
      allComplete: false,
      fillPercent: 80,
    };
  }

  if (c.status === "patient_responded" || c.status === "red_flag") {
    return {
      activeStep: 2,
      statusLabel: "In Review",
      badge: "Pending",
      allComplete: false,
      fillPercent: 40,
    };
  }

  if (c.status === "more_info_needed" || c.documentsNeedAttention) {
    return {
      activeStep: 1,
      statusLabel: "Waiting for Documents",
      badge: "Pending",
      allComplete: false,
      fillPercent: 20,
    };
  }

  if (c.status === "pending") {
    return {
      activeStep: 2,
      statusLabel: "In Review",
      badge: "Pending",
      allComplete: false,
      fillPercent: 40,
    };
  }

  return {
    activeStep: 2,
    statusLabel: "In Review",
    badge: "Pending",
    allComplete: false,
    fillPercent: 40,
  };
}

export function progressForShopOrder(status: string): OrderProgressState {
  switch (status) {
    case "delivered":
      return {
        activeStep: 5,
        statusLabel: "Dispatched",
        badge: "Fulfilled",
        allComplete: true,
        fillPercent: 100,
      };
    case "shipped":
      return {
        activeStep: 5,
        statusLabel: "Dispatched",
        badge: "Fulfilled",
        allComplete: true,
        fillPercent: 100,
      };
    case "preparing":
      return {
        activeStep: 4,
        statusLabel: "Ready for Dispatch",
        badge: "Pending",
        allComplete: false,
        fillPercent: 80,
      };
    case "paid":
      return {
        activeStep: 2,
        statusLabel: "In Review",
        badge: "Pending",
        allComplete: false,
        fillPercent: 40,
      };
    case "cancelled":
      return {
        activeStep: 0,
        statusLabel: "Cancelled",
        badge: "Cancelled",
        allComplete: false,
        fillPercent: 0,
      };
    default:
      return {
        activeStep: 1,
        statusLabel: "Waiting for Documents",
        badge: "Pending",
        allComplete: false,
        fillPercent: 20,
      };
  }
}

export type StepVisualState = "done" | "active" | "todo";

export function stepVisualStates(progress: OrderProgressState): StepVisualState[] {
  return ORDER_PROGRESS_STEPS.map((_, i) => {
    if (progress.allComplete) return "done";
    if (i < progress.activeStep) return "done";
    if (i === progress.activeStep) return "active";
    return "todo";
  });
}

const MOUNJARO_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/67653a4b46e84215ef90b607_mounjaro.jpg?v=1747311143";
const WEGOVY_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/wegovy-0.25mg-one-pen-4-weeks.jpg?v=1747817322";
const ORLISTAT_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/72cf77488ce5508cbd43380616b5bc3c72b3d74c-600x600.jpg?v=1754300149";
const NEEDLES_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/Insulin_Pen_Needles.png?v=1769012970";
const BUNDLE_IMG =
  "https://cdn.shopify.com/s/files/1/0935/0479/9065/files/3PACK_7c0ae7c7-969e-4131-82fd-793f88114d2e.png?v=1760103389";

export function productImageForCondition(conditionId?: string, medName?: string): string | null {
  const med = medName ?? "";
  if (/needle/i.test(med)) return NEEDLES_IMG;
  if (/bundle|trio|take-it-slow|3-pen/i.test(med)) return BUNDLE_IMG;
  if (/wegovy|semaglutide/i.test(med)) return WEGOVY_IMG;
  if (/orlistat/i.test(med)) return ORLISTAT_IMG;
  if (
    conditionId === "weight-loss" ||
    /mounjaro|wegovy|tirzepatide|semaglutide|orlistat/i.test(med)
  ) {
    return /wegovy|semaglutide/i.test(med) ? WEGOVY_IMG : MOUNJARO_IMG;
  }
  return null;
}

function parseDoseMg(dose: string): number | null {
  const m = dose.match(/([\d.]+)\s*mg/i);
  return m ? Number(m[1]) : null;
}

function detectWlProduct(med: string, conditionName?: string): WlProduct {
  if (/wegovy|semaglutide/i.test(med) || /wegovy/i.test(conditionName ?? "")) {
    return "wegovy";
  }
  return "mounjaro";
}

export function nextDoseRecommendation(
  currentDose: string | undefined,
  medName: string,
  conditionName?: string,
): { title: string; reorderBy: string } | null {
  const mg = currentDose ? parseDoseMg(currentDose) : null;
  if (mg == null) return null;

  const product = detectWlProduct(medName, conditionName);
  const ladder = doseLadderFor(product);
  const idx = ladder.findIndex((d) => Math.abs(d - mg) < 0.01);
  const nextMg = idx >= 0 && idx < ladder.length - 1 ? ladder[idx + 1]! : ladder[ladder.length - 1]!;
  const reorderBy = new Date();
  reorderBy.setDate(reorderBy.getDate() + 28);

  return {
    title: formatProductDose(product, nextMg),
    reorderBy: reorderBy.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  };
}
