import type { Consultation } from "@workspace/api-client-react";

export type PrescribableOption = {
  catalogId: string;
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
  priceLabel: string;
  priceGbpPence?: number;
};

export type RxItem = {
  name: string;
  strength: string;
  form: string;
  quantity: string;
  sig: string;
  duration: string;
  notes?: string;
};

function opt(
  catalogId: string,
  partial: Omit<PrescribableOption, "catalogId">,
): PrescribableOption {
  return { catalogId, ...partial };
}

const WEIGHT_LOSS: PrescribableOption[] = [
  opt("mounjaro-2_5", {
    name: "Mounjaro",
    strength: "2.5 mg",
    form: "Injection",
    quantity: "1",
    sig: "Inject once weekly as directed",
    duration: "4 weeks",
    priceLabel: "£144.99 / pen",
    priceGbpPence: 14499,
  }),
  opt("mounjaro-5", {
    name: "Mounjaro",
    strength: "5 mg",
    form: "Injection",
    quantity: "1",
    sig: "Inject once weekly as directed",
    duration: "4 weeks",
    priceLabel: "£154.99 / pen",
    priceGbpPence: 15499,
  }),
  opt("mounjaro-7_5", {
    name: "Mounjaro",
    strength: "7.5 mg",
    form: "Injection",
    quantity: "1",
    sig: "Inject once weekly as directed",
    duration: "4 weeks",
    priceLabel: "£174.99 / pen",
    priceGbpPence: 17499,
  }),
  opt("wegovy-0_25", {
    name: "Wegovy",
    strength: "0.25 mg",
    form: "Injection",
    quantity: "1",
    sig: "Inject once weekly as directed",
    duration: "4 weeks",
    priceLabel: "£79.99 / pen",
    priceGbpPence: 7999,
  }),
  opt("wegovy-0_5", {
    name: "Wegovy",
    strength: "0.5 mg",
    form: "Injection",
    quantity: "1",
    sig: "Inject once weekly as directed",
    duration: "4 weeks",
    priceLabel: "£89.99 / pen",
    priceGbpPence: 8999,
  }),
  opt("wegovy-1_0", {
    name: "Wegovy",
    strength: "1.0 mg",
    form: "Injection",
    quantity: "1",
    sig: "Inject once weekly as directed",
    duration: "4 weeks",
    priceLabel: "£99.99 / pen",
    priceGbpPence: 9999,
  }),
];

const ERECTILE_DYSFUNCTION: PrescribableOption[] = [
  opt("sildenafil-50", {
    name: "Sildenafil",
    strength: "50 mg",
    form: "Tablet",
    quantity: "8",
    sig: "Take ONE tablet about 1 hour before sexual activity",
    duration: "As required",
    priceLabel: "from £6 / 8 tablets",
    priceGbpPence: 600,
  }),
  opt("tadalafil-10", {
    name: "Tadalafil",
    strength: "10 mg",
    form: "Tablet",
    quantity: "4",
    sig: "Take ONE tablet before sexual activity",
    duration: "As required",
    priceLabel: "from £19 / 4 tablets",
    priceGbpPence: 1900,
  }),
  opt("tadalafil-daily-5", {
    name: "Tadalafil",
    strength: "5 mg daily",
    form: "Tablet",
    quantity: "28",
    sig: "Take ONE tablet once daily",
    duration: "28 days",
    priceLabel: "from £39 / month",
    priceGbpPence: 3900,
  }),
  opt("avanafil-100", {
    name: "Avanafil",
    strength: "100 mg",
    form: "Tablet",
    quantity: "4",
    sig: "Take ONE tablet about 15–30 minutes before sexual activity",
    duration: "As required",
    priceLabel: "from £29 / 4 tablets",
    priceGbpPence: 2900,
  }),
  opt("vardenafil-10", {
    name: "Vardenafil",
    strength: "10 mg",
    form: "Tablet",
    quantity: "4",
    sig: "Take ONE tablet 25–60 minutes before sexual activity",
    duration: "As required",
    priceLabel: "from £24 / 4 tablets",
    priceGbpPence: 2400,
  }),
];

const HAIR_LOSS: PrescribableOption[] = [
  opt("finasteride-1mg", {
    name: "Finasteride",
    strength: "1 mg",
    form: "Tablet",
    quantity: "28",
    sig: "Take ONE tablet once daily",
    duration: "28 days",
    priceLabel: "from £19 / month",
    priceGbpPence: 1900,
  }),
  opt("minoxidil-5", {
    name: "Minoxidil",
    strength: "5% topical",
    form: "Solution",
    quantity: "1",
    sig: "Apply to scalp twice daily as directed",
    duration: "28 days",
    priceLabel: "from £15 / month",
    priceGbpPence: 1500,
  }),
  opt("dutasteride-0_5", {
    name: "Dutasteride",
    strength: "0.5 mg",
    form: "Capsule",
    quantity: "28",
    sig: "Take ONE capsule once daily",
    duration: "28 days",
    priceLabel: "from £39 / month",
    priceGbpPence: 3900,
  }),
];

const ALLERGIC_RHINITIS: PrescribableOption[] = [
  opt("fexofenadine-180", {
    name: "Fexofenadine",
    strength: "180 mg",
    form: "Tablet",
    quantity: "30",
    sig: "Take ONE tablet once daily",
    duration: "30 days",
    priceLabel: "from £15 / month",
    priceGbpPence: 1500,
  }),
  opt("dymista", {
    name: "Dymista",
    strength: "Azelastine + fluticasone",
    form: "Nasal spray",
    quantity: "1",
    sig: "Two sprays per nostril twice daily",
    duration: "30 days",
    priceLabel: "from £27 / spray",
    priceGbpPence: 2700,
  }),
  opt("olopatadine-drops", {
    name: "Olopatadine",
    strength: "0.1%",
    form: "Eye drops",
    quantity: "1",
    sig: "One drop in each affected eye twice daily",
    duration: "30 days",
    priceLabel: "from £19 / bottle",
    priceGbpPence: 1900,
  }),
];

const CATALOG_BY_CONDITION: Record<string, PrescribableOption[]> = {
  "weight-loss": WEIGHT_LOSS,
  "erectile-dysfunction": ERECTILE_DYSFUNCTION,
  "hair-loss": HAIR_LOSS,
  "allergic-rhinitis": ALLERGIC_RHINITIS,
};

/** Default strengths when building from condition name tokens. */
const MED_DEFAULTS: Record<
  string,
  { strength: string; form: string; quantity: string; sig: string; duration: string }
> = {
  sildenafil: {
    strength: "50 mg",
    form: "Tablet",
    quantity: "8",
    sig: "Take ONE tablet about 1 hour before sexual activity",
    duration: "As required",
  },
  tadalafil: {
    strength: "10 mg",
    form: "Tablet",
    quantity: "4",
    sig: "Take ONE tablet before sexual activity",
    duration: "As required",
  },
  trimethoprim: {
    strength: "200 mg",
    form: "Tablet",
    quantity: "6",
    sig: "Take ONE tablet twice daily for 3 days",
    duration: "3 days",
  },
  nitrofurantoin: {
    strength: "100 mg",
    form: "Capsule",
    quantity: "6",
    sig: "Take ONE capsule twice daily for 3 days",
    duration: "3 days",
  },
  finasteride: {
    strength: "1 mg",
    form: "Tablet",
    quantity: "28",
    sig: "Take ONE tablet once daily",
    duration: "28 days",
  },
  dapoxetine: {
    strength: "30 mg",
    form: "Tablet",
    quantity: "3",
    sig: "Take ONE tablet 1–3 hours before intercourse",
    duration: "As required",
  },
  metronidazole: {
    strength: "400 mg",
    form: "Tablet",
    quantity: "14",
    sig: "Take ONE tablet twice daily",
    duration: "7 days",
  },
};

function parseMedicineTokens(conditionName: string): string[] {
  const paren = conditionName.match(/\(([^)]+)\)/);
  if (paren?.[1]) {
    return paren[1]
      .split(/[·•|/]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [conditionName.replace(/\s*\([^)]*\)\s*/, "").trim()];
}

function tokenToOption(
  token: string,
  conditionId: string,
  index: number,
  priceGbpPence?: number,
): PrescribableOption {
  const baseName = token.replace(/\s*\(.*\)$/, "").trim();
  const key = baseName.toLowerCase().split(/\s+/)[0] ?? "";
  const defaults = MED_DEFAULTS[key];
  const priceLabel =
    priceGbpPence != null
      ? `£${(priceGbpPence / 100).toFixed(2)}`
      : "Price on approval";

  return opt(`${conditionId}-parsed-${index}`, {
    name: baseName,
    strength: defaults?.strength ?? "As directed",
    form: defaults?.form ?? "Supply",
    quantity: defaults?.quantity ?? "1",
    sig: defaults?.sig ?? "As directed",
    duration: defaults?.duration ?? "28 days",
    priceLabel,
    priceGbpPence,
  });
}

export function getPrimaryRxItem(c: Consultation): RxItem | null {
  const raw = (c.prescriptionItems ?? []) as RxItem[];
  if (raw.length > 0 && raw[0]?.name) {
    return {
      name: raw[0].name ?? "",
      strength: raw[0].strength ?? "",
      form: raw[0].form ?? "Supply",
      quantity: String(raw[0].quantity ?? "1"),
      sig: raw[0].sig ?? "As directed",
      duration: raw[0].duration ?? "28 days",
      notes: raw[0].notes,
    };
  }
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const plan =
    typeof answers.selected_plan === "string" ? answers.selected_plan : null;
  if (plan || c.conditionName) {
    return {
      name: plan?.split("·")[0]?.trim() || c.conditionName,
      strength:
        typeof answers.current_dose === "string" ? answers.current_dose : "",
      form: "Supply",
      quantity: "1",
      sig: "As directed",
      duration: "28 days",
    };
  }
  return null;
}

function itemsMatch(a: RxItem, b: PrescribableOption): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  return (
    norm(a.name) === norm(b.name) && norm(a.strength) === norm(b.strength)
  );
}

export function optionFromRxItem(
  item: RxItem,
  catalogId = "current",
  priceLabel = "Current selection",
): PrescribableOption {
  return opt(catalogId, {
    name: item.name,
    strength: item.strength || "—",
    form: item.form,
    quantity: item.quantity,
    sig: item.sig,
    duration: item.duration,
    priceLabel,
  });
}

export function getPrescribableOptions(c: Consultation): PrescribableOption[] {
  const catalog = CATALOG_BY_CONDITION[c.conditionId];
  const answers = (c.answers ?? {}) as Record<string, unknown>;
  const pricePence =
    typeof answers.order_price_gbp_pence === "number"
      ? answers.order_price_gbp_pence
      : undefined;

  let options: PrescribableOption[] = catalog
    ? [...catalog]
    : parseMedicineTokens(c.conditionName).map((token, i) =>
        tokenToOption(token, c.conditionId, i, pricePence),
      );

  const current = getPrimaryRxItem(c);
  if (current?.name.trim()) {
    const matched = options.some((o) => itemsMatch(current, o));
    if (!matched) {
      options = [
        optionFromRxItem(current, "current", "Current selection"),
        ...options,
      ];
    }
  }

  if (options.length === 0 && current) {
    options = [optionFromRxItem(current)];
  }

  return options;
}

export function findSelectedCatalogId(
  options: PrescribableOption[],
  current: RxItem | null,
): string {
  if (!current) return options[0]?.catalogId ?? "";
  const hit = options.find((o) => itemsMatch(current, o));
  return hit?.catalogId ?? options[0]?.catalogId ?? "";
}

export function optionToRxItems(option: PrescribableOption): RxItem[] {
  return [
    {
      name: option.name,
      strength: option.strength,
      form: option.form,
      quantity: option.quantity,
      sig: option.sig,
      duration: option.duration,
    },
  ];
}

export function formatOptionLabel(option: PrescribableOption): string {
  const qty =
    option.quantity && option.quantity !== "1"
      ? ` · Qty ${option.quantity}`
      : "";
  return `${option.name} ${option.strength}${qty} — ${option.priceLabel}`;
}
