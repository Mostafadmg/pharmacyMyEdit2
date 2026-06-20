export type ReviewMilestoneId = "start" | "3month" | "6month" | "12month";

export type ReviewStepState = "completed" | "active" | "locked";

export type ReviewMilestone = {
  id: ReviewMilestoneId;
  label: string;
  subtitle: string;
  pensRequired: number;
  heroTitle: string;
  heroBody: string;
};

export const REVIEW_MILESTONES: ReviewMilestone[] = [
  {
    id: "start",
    label: "Treatment Start",
    subtitle: "Baseline videos",
    pensRequired: 0,
    heroTitle: "Your baseline check-in",
    heroBody:
      "Record your full body and weight scale videos so our prescriber can verify your starting point before treatment.",
  },
  {
    id: "3month",
    label: "3 Month Review",
    subtitle: "Progress check-in",
    pensRequired: 3,
    heroTitle: "Your 3-month check-in",
    heroBody:
      "Time for a quick progress review. Record fresh videos so we can confirm your treatment is working safely.",
  },
  {
    id: "6month",
    label: "6 Month Review",
    subtitle: "Halfway review",
    pensRequired: 6,
    heroTitle: "Your 6-month check-in",
    heroBody:
      "You're halfway through your first year — record updated videos for your prescriber to review.",
  },
  {
    id: "12month",
    label: "12 Month Review",
    subtitle: "Annual review",
    pensRequired: 12,
    heroTitle: "Your 12-month check-in",
    heroBody:
      "Annual progress review — help us confirm your dose is still right with updated body and weight videos.",
  },
];

export type ReviewTimelineStep = ReviewMilestone & {
  state: ReviewStepState;
  stateLabel: string;
};

export type ReviewTimeline = {
  steps: ReviewTimelineStep[];
  activeMilestone: ReviewMilestone | null;
  pensDispensed: number;
};

type DocumentSlot = {
  docId: string;
  status: string;
};

function isVideoComplete(slots: DocumentSlot[]): boolean {
  const full = slots.find((s) => s.docId === "full-body-video");
  const weight = slots.find((s) => s.docId === "weight-scale-video");
  const ok = (s?: DocumentSlot) =>
    s?.status === "uploaded" || s?.status === "verified";
  return ok(full) && ok(weight);
}

function parsePenCountFromQuantity(quantity?: string | null): number {
  if (!quantity) return 0;
  const m = quantity.match(/(\d+)\s*pen/i);
  return m ? Number.parseInt(m[1]!, 10) : 0;
}

type OrderLike = {
  status: string;
  prescriptionItems?: Array<{ quantity?: string }> | null;
  items?: Array<{ quantity?: number }> | null;
};

const DISPATCHED_STATUSES = new Set([
  "dispatched",
  "shipped",
  "delivered",
  "completed",
  "ready_to_dispatch",
  "ready_for_dispatch",
]);

export function countDispatchedPens(orders: OrderLike[]): number {
  let pens = 0;
  for (const order of orders) {
    if (!DISPATCHED_STATUSES.has(order.status.toLowerCase())) continue;

    let orderPens = 0;
    for (const pi of order.prescriptionItems ?? []) {
      orderPens += parsePenCountFromQuantity(pi.quantity) || 1;
    }
    if (orderPens === 0) {
      for (const item of order.items ?? []) {
        orderPens += item.quantity ?? 1;
      }
    }
    pens += orderPens > 0 ? orderPens : 1;
  }
  return pens;
}

function readCompletedReviews(
  answers: Record<string, unknown> | undefined,
): Partial<Record<ReviewMilestoneId, boolean>> {
  const raw = answers?.quarterly_reviews;
  if (!raw || typeof raw !== "object") return {};
  return raw as Partial<Record<ReviewMilestoneId, boolean>>;
}

export function buildReviewTimeline(input: {
  pensDispensed: number;
  documentSlots: DocumentSlot[];
  answers?: Record<string, unknown>;
}): ReviewTimeline {
  const { pensDispensed, documentSlots, answers } = input;
  const stored = readCompletedReviews(answers);
  const baselineVideos = isVideoComplete(documentSlots);

  const completed = new Set<ReviewMilestoneId>();
  if (stored.start || baselineVideos) completed.add("start");
  if (stored["3month"]) completed.add("3month");
  if (stored["6month"]) completed.add("6month");
  if (stored["12month"]) completed.add("12month");

  let activeId: ReviewMilestoneId | null = null;

  const steps: ReviewTimelineStep[] = REVIEW_MILESTONES.map((milestone) => {
    const unlocked = pensDispensed >= milestone.pensRequired;
    const isCompleted = completed.has(milestone.id);

    let state: ReviewStepState;
    let stateLabel: string;

    if (isCompleted) {
      state = "completed";
      stateLabel = "Completed";
    } else if (!unlocked) {
      state = "locked";
      const pensAway = Math.max(0, milestone.pensRequired - pensDispensed);
      stateLabel = pensAway === 1 ? "1 pen away" : `${pensAway} pens away`;
    } else {
      state = "active";
      stateLabel = "Due now";
      if (!activeId) activeId = milestone.id;
    }

    return { ...milestone, state, stateLabel };
  });

  const activeMilestone =
    activeId != null
      ? REVIEW_MILESTONES.find((m) => m.id === activeId) ?? null
      : null;

  return { steps, activeMilestone, pensDispensed };
}
